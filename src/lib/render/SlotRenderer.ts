import { Application, Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import type { Board, Cell } from '$engine/types';
import { skinFor } from '../skins';
import { Tile, TilePool } from './TilePool';
import { ParticleSystem } from './Particles';

/**
 * Generic, book-event-driven board renderer. It knows nothing about any game's
 * rules — it draws a board and animates reveals, wins, and tumbles on command;
 * the book player (player.ts) calls these in the order the math layer dictated.
 *
 * Performance notes (iOS Safari is the target):
 *  - Tiles are pooled (TilePool) and re-skinned in place — no Text/Graphics
 *    allocation per tumble step, which was the old renderer's worst GC offender.
 *  - Tumbles preserve surviving tiles and physically slide them down instead of
 *    rebuilding the whole board each step.
 *  - The particle system is hard-capped; GSAP tweens are killed on destroy.
 */
export class SlotRenderer {
  private app = new Application();
  private gameId: string;
  private cols: number;
  private rows: number;
  private accent: number;

  private bgLayer = new Container();
  private boardLayer = new Container();
  private fxLayer = new Container();
  private particles!: ParticleSystem;
  private pool!: TilePool;

  /** tiles[col][row] — the tile currently occupying each cell (or null). */
  private tiles: (Tile | null)[][] = [];
  private tile = 64;
  private gap = 6;
  private mounted = false;

  constructor(gameId: string, cols: number, rows: number, accent = '#1f9e89') {
    this.gameId = gameId;
    this.cols = cols;
    this.rows = rows;
    this.accent = parseHex(accent);
  }

  async mount(el: HTMLElement): Promise<void> {
    const width = Math.min(el.clientWidth || 360, 560);
    this.tile = Math.floor((width - this.gap * (this.cols + 1)) / this.cols);
    const height = this.rows * this.tile + this.gap * (this.rows + 1);

    await this.app.init({
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true
    });
    el.appendChild(this.app.canvas);
    this.app.stage.addChild(this.bgLayer, this.boardLayer, this.fxLayer);

    this.pool = new TilePool(this.gameId, this.tile);
    this.particles = new ParticleSystem(this.fxLayer);
    this.drawBackground(width, height);
    this.mounted = true;
  }

  private get pxWidth(): number {
    return this.app.renderer.width / this.app.renderer.resolution;
  }
  private get pxHeight(): number {
    return this.app.renderer.height / this.app.renderer.resolution;
  }

  private cellCenterX(col: number): number {
    return this.gap + col * (this.tile + this.gap) + this.tile / 2;
  }
  private cellCenterY(row: number): number {
    return this.gap + row * (this.tile + this.gap) + this.tile / 2;
  }

  /** Soft themed background: accent glow + vignette + slow-drifting motes. */
  private drawBackground(w: number, h: number): void {
    const base = new Graphics();
    base.rect(0, 0, w, h).fill({ color: 0x0b0e16, alpha: 0.0 });
    // Accent glow from the top, faked with stacked translucent circles.
    for (let i = 8; i >= 1; i--) {
      base
        .circle(w / 2, h * 0.18, (i / 8) * w * 0.8)
        .fill({ color: this.accent, alpha: 0.03 });
    }
    // Vignette corners.
    base.rect(0, 0, w, h).stroke({ width: 40, color: 0x000000, alpha: 0.25 });
    this.bgLayer.addChild(base);

    // A few drifting motes for life.
    for (let i = 0; i < 14; i++) {
      const m = new Graphics();
      const r = 1 + Math.random() * 2.5;
      m.circle(0, 0, r).fill({ color: 0xffffff, alpha: 0.06 + Math.random() * 0.06 });
      m.position.set(Math.random() * w, Math.random() * h);
      this.bgLayer.addChild(m);
      gsap.to(m, {
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

  /** A short landing squash-and-settle for a tile that just dropped into place. */
  private landBounce(t: Tile, delay = 0): void {
    t.view.scale.set(1, 1);
    gsap.fromTo(
      t.view.scale,
      { x: 1.12, y: 0.86 },
      { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)', delay }
    );
  }

  /** Full (re)build of the board, used on a fresh reveal. */
  async renderBoard(board: Board, drop = true): Promise<void> {
    if (!this.mounted) return;
    // Recycle whatever is on the board.
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
          t.view.position.y = targetY - this.pxHeight - this.tile;
          const delay = col * 0.045 + row * 0.03;
          tweens.push(
            tweenP(t.view.position, {
              y: targetY,
              duration: 0.34,
              delay,
              ease: 'back.out(1.5)'
            }).then(() => this.landBounce(t))
          );
        }
      }
    }
    if (drop) await Promise.all(tweens);
  }

  /** Pulse winning cells (scale + glow flash) and spark from the cluster centre. */
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
          gsap.to(t.view.scale, {
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
    // A small spark at the cluster centroid sells the hit.
    const skin = skinFor(this.gameId, this.tiles[cells[0].col]?.[cells[0].row]?.currentSymbol ?? '');
    this.particles.burst(cx / cells.length, cy / cells.length, 0.15, skin.color || this.accent);
    await Promise.all(tweens);
  }

  /**
   * Physical cascade: shatter the cleared cells, slide surviving tiles down, and
   * drop fresh tiles in from above — preserving tile identity for survivors.
   * `newBoard` is the post-tumble board the math layer produced.
   */
  async tumble(cleared: Cell[], newBoard: Board): Promise<void> {
    if (!this.mounted) return;
    const clearedByCol = new Map<number, Set<number>>();
    for (const c of cleared) {
      if (!clearedByCol.has(c.col)) clearedByCol.set(c.col, new Set());
      clearedByCol.get(c.col)!.add(c.row);
    }

    // Shatter + recycle cleared tiles.
    for (const c of cleared) {
      const t = this.tiles[c.col]?.[c.row];
      if (!t) continue;
      const skin = skinFor(this.gameId, t.currentSymbol);
      this.particles.shatter(this.cellCenterX(c.col), this.cellCenterY(c.row), skin.color);
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

      // Survivors settle at the bottom, preserving order.
      let r = rows - 1;
      for (let i = survivors.length - 1; i >= 0; i--) nextCol[r--] = survivors[i];
      // Fresh tiles fill the top rows (which the math layer placed there).
      for (let nr = 0; nr < newCount; nr++) {
        const t = this.pool.acquire(newBoard[col][nr]);
        this.boardLayer.addChild(t.view);
        // Start above the board, stacked so they cascade in.
        t.view.position.set(this.cellCenterX(col), this.cellCenterY(nr) - (newCount - nr) * (this.tile + this.gap) - this.tile);
        nextCol[nr] = t;
      }
      this.tiles[col] = nextCol;

      // Animate every tile in the column to its target row.
      for (let row = 0; row < rows; row++) {
        const t = nextCol[row];
        if (!t) continue;
        const targetY = this.cellCenterY(row);
        if (Math.abs(t.view.position.y - targetY) < 0.5) continue;
        const delay = col * 0.02 + (rows - row) * 0.03;
        tweens.push(
          tweenP(t.view.position, {
            y: targetY,
            duration: 0.3,
            delay,
            ease: 'back.out(1.2)'
          }).then(() => this.landBounce(t))
        );
      }
    }
    await Promise.all(tweens);
  }

  /** Celebration scaled to win size: particle fountain, flash, and (if big) shake. */
  async celebrate(intensity: number, big: boolean): Promise<void> {
    if (!this.mounted) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    this.particles.burst(this.pxWidth / 2, this.pxHeight * 0.62, clamped, big ? 0xe8c468 : 0xffffff);

    const flash = new Graphics();
    flash.rect(0, 0, this.pxWidth, this.pxHeight).fill({
      color: big ? 0xe8c468 : 0xffffff,
      alpha: big ? 0.22 : 0.12
    });
    this.fxLayer.addChild(flash);

    if (big) this.shake(6 + clamped * 8);
    await new Promise<void>((res) =>
      gsap.to(flash, { alpha: 0, duration: big ? 0.55 : 0.25, onComplete: res })
    );
    flash.destroy();
  }

  /** Back-compat alias used by the book player for scatter/final flashes. */
  async winFlash(big: boolean): Promise<void> {
    await this.celebrate(big ? 0.85 : 0.35, big);
  }

  private shake(magnitude: number): void {
    const s = this.app.stage;
    gsap.fromTo(
      s,
      { x: -magnitude },
      { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.25)', onComplete: () => (s.x = 0) }
    );
  }

  destroy(): void {
    if (!this.mounted) return;
    this.mounted = false;
    gsap.killTweensOf('*');
    this.particles?.destroy();
    this.pool?.destroy();
    this.app.destroy(true, { children: true });
  }
}

/** Promise wrapper around a GSAP property tween. */
function tweenP(target: object, vars: gsap.TweenVars): Promise<void> {
  return new Promise<void>((resolve) => {
    gsap.to(target, { ...vars, onComplete: resolve });
  });
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function parseHex(css: string): number {
  return parseInt(css.replace('#', ''), 16) || 0x1f9e89;
}
