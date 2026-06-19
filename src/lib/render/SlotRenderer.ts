import { Application, Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import type { Board, Cell } from '$engine/types';
import { skinFor } from '../skins';
import { Tile, TilePool } from './TilePool';
import { ParticleSystem } from './Particles';
import { getSharedApp } from './app';

/**
 * Generic, book-event-driven board renderer. It draws a board and animates
 * reveals, wins, and tumbles on command; the book player (player.ts) calls these
 * in the order the math layer dictated. It knows nothing about game rules.
 *
 * Lifecycle: it borrows the shared PixiJS Application (see app.ts) and only ever
 * adds/removes its OWN layers and tweens, never destroying the WebGL context —
 * that's what makes switching games safe on iOS.
 */
export class SlotRenderer {
  private app: Application | null = null;
  private gameId: string;
  private cols: number;
  private rows: number;
  private accent: number;

  private root = new Container(); // holds all of this renderer's layers
  private bgLayer = new Container();
  private boardLayer = new Container();
  private fxLayer = new Container();
  private particles: ParticleSystem | null = null;
  private pool: TilePool | null = null;

  private tiles: (Tile | null)[][] = [];
  private tile = 64;
  private gap = 7;
  private mounted = false;
  private destroyed = false;
  private w = 360;
  private h = 360;

  /** Every tween this renderer creates, so teardown kills only its own. */
  private tweens = new Set<gsap.core.Tween>();

  constructor(gameId: string, cols: number, rows: number, accent = '#1f9e89') {
    this.gameId = gameId;
    this.cols = cols;
    this.rows = rows;
    this.accent = parseHex(accent);
  }

  private tw(target: object, vars: gsap.TweenVars): gsap.core.Tween {
    const t = gsap.to(target, vars);
    this.tweens.add(t);
    return t;
  }
  private twFrom(target: object, from: gsap.TweenVars, to: gsap.TweenVars): gsap.core.Tween {
    const t = gsap.fromTo(target, from, to);
    this.tweens.add(t);
    return t;
  }
  private tweenP(target: object, vars: gsap.TweenVars): Promise<void> {
    return new Promise<void>((resolve) => {
      this.tw(target, { ...vars, onComplete: resolve });
    });
  }

  async mount(el: HTMLElement): Promise<void> {
    // Size the board to fit BOTH the available width and height, so it fills the
    // screen on tall phones instead of floating with dead space beneath it.
    const availW = Math.min(el.clientWidth || 360, 560);
    const availH = el.clientHeight || availW;
    const tileByW = (availW - this.gap * (this.cols + 1)) / this.cols;
    const tileByH = (availH - this.gap * (this.rows + 1)) / this.rows;
    this.tile = Math.max(28, Math.floor(Math.min(tileByW, tileByH)));
    this.w = this.cols * this.tile + this.gap * (this.cols + 1);
    this.h = this.rows * this.tile + this.gap * (this.rows + 1);

    const app = await getSharedApp();
    if (this.destroyed) return; // navigated away while initializing
    this.app = app;
    app.renderer.resize(this.w, this.h);

    this.root.addChild(this.bgLayer, this.boardLayer, this.fxLayer);
    app.stage.addChild(this.root);
    el.appendChild(app.canvas);

    this.pool = new TilePool(this.gameId, this.tile);
    this.particles = new ParticleSystem(this.fxLayer);
    this.drawBackground();
    this.mounted = true;
  }

  private cellCenterX(col: number): number {
    return this.gap + col * (this.tile + this.gap) + this.tile / 2;
  }
  private cellCenterY(row: number): number {
    return this.gap + row * (this.tile + this.gap) + this.tile / 2;
  }

  /** Soft themed background: accent glow, frame, vignette, drifting motes. */
  private drawBackground(): void {
    const { w, h } = this;
    const g = new Graphics();
    // Deep base wash so the board reads against it.
    g.roundRect(0, 0, w, h, 16).fill({ color: 0x070a12, alpha: 0.55 });
    // Accent glow from the top, stacked translucent circles.
    for (let i = 9; i >= 1; i--) {
      g.circle(w / 2, h * 0.1, (i / 9) * w * 0.95).fill({ color: this.accent, alpha: 0.05 });
    }
    // Gold-ish frame + inner vignette.
    g.roundRect(2, 2, w - 4, h - 4, 14).stroke({ width: 2, color: lighten(this.accent, 0.4), alpha: 0.5 });
    g.roundRect(0, 0, w, h, 16).stroke({ width: 26, color: 0x000000, alpha: 0.22 });
    this.bgLayer.addChild(g);

    for (let i = 0; i < 14; i++) {
      const m = new Graphics();
      const r = 1 + Math.random() * 2.5;
      m.circle(0, 0, r).fill({ color: 0xffffff, alpha: 0.05 + Math.random() * 0.06 });
      m.position.set(Math.random() * w, Math.random() * h);
      this.bgLayer.addChild(m);
      this.tw(m, {
        y: m.y - (20 + Math.random() * 40),
        x: m.x + (Math.random() - 0.5) * 30,
        alpha: 0.02,
        duration: 4 + Math.random() * 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 3
      });
    }
  }

  private placeTile(t: Tile, col: number, row: number): void {
    t.view.position.set(this.cellCenterX(col), this.cellCenterY(row));
  }

  private landBounce(t: Tile, delay = 0): void {
    t.view.scale.set(1, 1);
    this.twFrom(
      t.view.scale,
      { x: 1.12, y: 0.86 },
      { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)', delay }
    );
  }

  async renderBoard(board: Board, drop = true): Promise<void> {
    if (!this.mounted || !this.pool) return;
    for (const col of this.tiles) for (const t of col) if (t) this.pool.release(t);
    this.tiles = [];

    const tweens: Promise<void>[] = [];
    for (let col = 0; col < board.length; col++) {
      this.tiles[col] = [];
      for (let row = 0; row < board[col].length; row++) {
        const t = this.pool.acquire(board[col][row]);
        this.boardLayer.addChild(t.view);
        this.placeTile(t, col, row);
        this.tiles[col][row] = t;
        if (drop) {
          const targetY = this.cellCenterY(row);
          t.view.position.y = targetY - this.h - this.tile;
          tweens.push(
            this.tweenP(t.view.position, {
              y: targetY,
              duration: 0.34,
              delay: col * 0.045 + row * 0.03,
              ease: 'back.out(1.5)'
            }).then(() => this.landBounce(t))
          );
        }
      }
    }
    if (drop) await Promise.all(tweens);
  }

  async highlight(cells: Cell[]): Promise<void> {
    if (!this.mounted || cells.length === 0) return;
    let cx = 0;
    let cy = 0;
    const tweens: Promise<void>[] = [];
    for (const { col, row } of cells) {
      cx += this.cellCenterX(col);
      cy += this.cellCenterY(row);
      const t = this.tiles[col]?.[row];
      if (!t) continue;
      tweens.push(
        new Promise<void>((res) => {
          this.tw(t.view.scale, {
            x: 1.2,
            y: 1.2,
            duration: 0.16,
            yoyo: true,
            repeat: 1,
            ease: 'sine.inOut',
            onComplete: res
          });
        })
      );
    }
    const sym = this.tiles[cells[0].col]?.[cells[0].row]?.currentSymbol ?? '';
    const skin = skinFor(this.gameId, sym);
    this.particles?.burst(cx / cells.length, cy / cells.length, 0.15, skin.color || this.accent);
    await Promise.all(tweens);
  }

  async tumble(cleared: Cell[], newBoard: Board): Promise<void> {
    if (!this.mounted || !this.pool) return;
    for (const c of cleared) {
      const t = this.tiles[c.col]?.[c.row];
      if (!t) continue;
      const skin = skinFor(this.gameId, t.currentSymbol);
      this.particles?.shatter(this.cellCenterX(c.col), this.cellCenterY(c.row), skin.color);
      this.pool.release(t);
      this.tiles[c.col][c.row] = null;
    }
    await wait(120);

    const tweens: Promise<void>[] = [];
    for (let col = 0; col < newBoard.length; col++) {
      const rows = newBoard[col].length;
      const survivors = (this.tiles[col] ?? []).filter((t): t is Tile => t !== null);
      const newCount = rows - survivors.length;
      const nextCol: (Tile | null)[] = new Array(rows).fill(null);

      let r = rows - 1;
      for (let i = survivors.length - 1; i >= 0; i--) nextCol[r--] = survivors[i];
      for (let nr = 0; nr < newCount; nr++) {
        const t = this.pool.acquire(newBoard[col][nr]);
        this.boardLayer.addChild(t.view);
        t.view.position.set(
          this.cellCenterX(col),
          this.cellCenterY(nr) - (newCount - nr) * (this.tile + this.gap) - this.tile
        );
        nextCol[nr] = t;
      }
      this.tiles[col] = nextCol;

      for (let row = 0; row < rows; row++) {
        const t = nextCol[row];
        if (!t) continue;
        const targetY = this.cellCenterY(row);
        if (Math.abs(t.view.position.y - targetY) < 0.5) continue;
        tweens.push(
          this.tweenP(t.view.position, {
            y: targetY,
            duration: 0.3,
            delay: col * 0.02 + (rows - row) * 0.03,
            ease: 'back.out(1.2)'
          }).then(() => this.landBounce(t))
        );
      }
    }
    await Promise.all(tweens);
  }

  async celebrate(intensity: number, big: boolean): Promise<void> {
    if (!this.mounted) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    this.particles?.burst(this.w / 2, this.h * 0.62, clamped, big ? 0xe8c468 : 0xffffff);

    const flash = new Graphics();
    flash.rect(0, 0, this.w, this.h).fill({ color: big ? 0xe8c468 : 0xffffff, alpha: big ? 0.22 : 0.12 });
    this.fxLayer.addChild(flash);
    if (big) this.shake(6 + clamped * 8);
    await new Promise<void>((res) =>
      this.tw(flash, { alpha: 0, duration: big ? 0.55 : 0.25, onComplete: res })
    );
    flash.destroy();
  }

  async winFlash(big: boolean): Promise<void> {
    await this.celebrate(big ? 0.85 : 0.35, big);
  }

  private shake(magnitude: number): void {
    this.twFrom(
      this.root,
      { x: -magnitude },
      { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.25)' }
    );
  }

  destroy(): void {
    this.destroyed = true;
    this.mounted = false;
    for (const t of this.tweens) t.kill();
    this.tweens.clear();
    this.particles?.killTweens();
    this.pool?.destroy();
    // Remove and destroy only our own layers; the shared app/context lives on.
    if (this.root.parent) this.root.parent.removeChild(this.root);
    this.root.destroy({ children: true });
  }
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function parseHex(css: string): number {
  return parseInt(css.replace('#', ''), 16) || 0x1f9e89;
}

function lighten(color: number, amt: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + 255 * amt);
  const g = Math.min(255, ((color >> 8) & 0xff) + 255 * amt);
  const b = Math.min(255, (color & 0xff) + 255 * amt);
  return (r << 16) | (g << 8) | b;
}
