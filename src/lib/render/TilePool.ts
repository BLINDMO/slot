import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { skinFor } from '../skins';

/**
 * A reusable, retained-mode board tile. The expensive parts (the Graphics body
 * and the Text glyph) are created once and re-skinned in place, so a tumble step
 * or a fresh spin never has to allocate/destroy a `Text` or `Graphics` — that
 * was the old renderer's worst frame-time and GC offender, and a real problem on
 * iOS Safari where Text re-rasterization is costly.
 */
export class Tile {
  readonly view = new Container();
  private body = new Graphics();
  private glyph: Text;
  private symbol = '';
  private size: number;
  private gameId: string;

  constructor(gameId: string, size: number) {
    this.gameId = gameId;
    this.size = size;
    const style = new TextStyle({
      fill: 0xffffff,
      fontSize: size * 0.5,
      fontWeight: '700',
      fontFamily: 'system-ui, sans-serif',
      // A soft drop shadow gives the glyphs depth without an asset.
      dropShadow: { color: 0x000000, alpha: 0.35, blur: 3, distance: 2, angle: Math.PI / 2 }
    });
    this.glyph = new Text({ text: '', style });
    this.glyph.anchor.set(0.5);
    this.glyph.position.set(size / 2, size / 2);
    this.view.addChild(this.body, this.glyph);
    // Pivot at the tile centre so scale/rotation pulses stay put.
    this.view.pivot.set(size / 2, size / 2);
  }

  /** Re-paint this tile for a (possibly new) symbol, reusing the same display objects. */
  setSymbol(symbol: string): void {
    if (symbol === this.symbol) return;
    this.symbol = symbol;
    const skin = skinFor(this.gameId, symbol);
    const s = this.size;

    this.body.clear();
    // Subtle top-down gradient feel via two stacked fills.
    this.body.roundRect(0, 0, s, s, 10).fill(skin.color);
    this.body.roundRect(0, 0, s, s * 0.5, 10).fill({ color: 0xffffff, alpha: 0.07 });
    if (skin.special) {
      this.body.roundRect(2, 2, s - 4, s - 4, 9).stroke({ width: 2, color: 0xffffff, alpha: 0.55 });
    }
    this.body.roundRect(0.5, 0.5, s - 1, s - 1, 10).stroke({ width: 1, color: 0x000000, alpha: 0.25 });

    this.glyph.text = skin.glyph;
    (this.glyph.style as TextStyle).fontSize = skin.glyph.length > 2 ? s * 0.26 : s * 0.5;
  }

  get currentSymbol(): string {
    return this.symbol;
  }

  /** Reset transform so a recycled tile starts clean. */
  reset(): void {
    this.view.alpha = 1;
    this.view.scale.set(1, 1);
    this.view.rotation = 0;
    this.view.visible = true;
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}

/**
 * Pool of `Tile`s. The board never holds more than cols×rows tiles, but tumbles
 * churn through symbols, so recycling avoids per-step allocation.
 */
export class TilePool {
  private free: Tile[] = [];
  private gameId: string;
  private size: number;

  constructor(gameId: string, size: number) {
    this.gameId = gameId;
    this.size = size;
  }

  acquire(symbol: string): Tile {
    const t = this.free.pop() ?? new Tile(this.gameId, this.size);
    t.reset();
    t.setSymbol(symbol);
    return t;
  }

  release(t: Tile): void {
    t.view.visible = false;
    if (t.view.parent) t.view.parent.removeChild(t.view);
    this.free.push(t);
  }

  destroy(): void {
    for (const t of this.free) t.destroy();
    this.free = [];
  }
}
