import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import type { Board, Cell } from '$engine/types';
import { skinFor } from '../skins';

/**
 * Generic, book-event-driven board renderer. It knows nothing about any game's
 * rules — it just draws a board and animates reveals, wins, and tumbles on
 * command. The book player (player.ts) calls these methods in the order the math
 * layer dictated. Works for any cols×rows grid (incl. ragged Megaways columns).
 */
export class SlotRenderer {
  private app = new Application();
  private gameId: string;
  private cols: number;
  private rows: number;
  private boardLayer = new Container();
  private fxLayer = new Container();
  private tiles: (Container | null)[][] = [];
  private tile = 64;
  private gap = 6;
  private mounted = false;

  constructor(gameId: string, cols: number, rows: number) {
    this.gameId = gameId;
    this.cols = cols;
    this.rows = rows;
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
    this.app.stage.addChild(this.boardLayer, this.fxLayer);
    this.mounted = true;
  }

  private cellX(col: number): number {
    return this.gap + col * (this.tile + this.gap);
  }
  private cellY(row: number): number {
    return this.gap + row * (this.tile + this.gap);
  }

  private makeTile(symbol: string): Container {
    const c = new Container();
    const skin = skinFor(this.gameId, symbol);
    const g = new Graphics();
    g.roundRect(0, 0, this.tile, this.tile, 10).fill(skin.color);
    if (skin.special) g.roundRect(2, 2, this.tile - 4, this.tile - 4, 9).stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
    c.addChild(g);
    const style = new TextStyle({
      fill: 0xffffff,
      fontSize: skin.glyph.length > 2 ? this.tile * 0.26 : this.tile * 0.5,
      fontWeight: '700',
      fontFamily: 'system-ui, sans-serif'
    });
    const t = new Text({ text: skin.glyph, style });
    t.anchor.set(0.5);
    t.position.set(this.tile / 2, this.tile / 2);
    c.addChild(t);
    // Anchor the container's transform at its center so scale pulses look right.
    c.pivot.set(this.tile / 2, this.tile / 2);
    return c;
  }

  /** Render a full board. If `drop` is true, tiles fall in from above. */
  async renderBoard(board: Board, drop = true): Promise<void> {
    if (!this.mounted) return;
    this.boardLayer.removeChildren();
    this.tiles = [];
    const tweens: Promise<void>[] = [];

    for (let col = 0; col < board.length; col++) {
      this.tiles[col] = [];
      for (let row = 0; row < board[col].length; row++) {
        const t = this.makeTile(board[col][row]);
        const targetX = this.cellX(col) + this.tile / 2;
        const targetY = this.cellY(row) + this.tile / 2;
        t.position.set(targetX, drop ? targetY - 300 : targetY);
        this.boardLayer.addChild(t);
        this.tiles[col][row] = t;
        if (drop) {
          tweens.push(
            tweenP(t.position, {
              y: targetY,
              duration: 0.32,
              delay: col * 0.04 + row * 0.02,
              ease: 'back.out(1.6)'
            })
          );
        }
      }
    }
    if (drop) await Promise.all(tweens);
  }

  /** Pulse the winning cells to draw the eye. */
  async highlight(cells: Cell[]): Promise<void> {
    if (!this.mounted) return;
    const tweens: Promise<void>[] = [];
    for (const { col, row } of cells) {
      const t = this.tiles[col]?.[row];
      if (!t) continue;
      tweens.push(
        new Promise<void>((res) => {
          gsap.to(t.scale, {
            x: 1.18,
            y: 1.18,
            duration: 0.18,
            yoyo: true,
            repeat: 1,
            ease: 'sine.inOut',
            onComplete: res
          });
        })
      );
    }
    await Promise.all(tweens);
  }

  /** Shrink + fade cleared tiles, then remove them (tumble step). */
  async clearCells(cells: Cell[]): Promise<void> {
    if (!this.mounted) return;
    const tweens: Promise<void>[] = [];
    for (const { col, row } of cells) {
      const t = this.tiles[col]?.[row];
      if (!t) continue;
      this.tiles[col][row] = null;
      tweens.push(
        new Promise<void>((res) => {
          gsap.to(t, { alpha: 0, duration: 0.2, onComplete: res });
          gsap.to(t.scale, { x: 0.3, y: 0.3, duration: 0.2 });
        })
      );
    }
    await Promise.all(tweens);
  }

  /** A brief celebratory flash scaled to win size. */
  async winFlash(big: boolean): Promise<void> {
    if (!this.mounted) return;
    const flash = new Graphics();
    flash.rect(0, 0, this.app.renderer.width, this.app.renderer.height).fill({
      color: big ? 0xe8c468 : 0xffffff,
      alpha: 0.18
    });
    this.fxLayer.addChild(flash);
    await new Promise<void>((res) =>
      gsap.to(flash, { alpha: 0, duration: big ? 0.6 : 0.25, onComplete: res })
    );
    flash.destroy();
  }

  destroy(): void {
    if (!this.mounted) return;
    this.mounted = false;
    gsap.killTweensOf('*');
    this.app.destroy(true, { children: true });
  }
}

/** Promise wrapper around a GSAP property tween. */
function tweenP(target: object, vars: gsap.TweenVars): Promise<void> {
  return new Promise<void>((resolve) => {
    gsap.to(target, { ...vars, onComplete: resolve });
  });
}
