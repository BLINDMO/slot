import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { skinFor } from '../skins';

/**
 * A reusable, retained-mode board tile. The expensive parts (the Graphics body
 * and the Text glyph) are created once and re-skinned in place, so a tumble step
 * or a fresh spin never has to allocate/destroy a Text or Graphics — that was the
 * old renderer's worst frame-time and GC offender, and a real problem on iOS
 * Safari where Text re-rasterization is costly.
 *
 * The body is drawn with stacked gradient/gloss/bevel passes (no external art) to
 * give each symbol real depth instead of a flat colored square.
 */
export class Tile {
  readonly view = new Container();
  private shadow = new Graphics();
  private body = new Graphics();
  private glyph: Text;
  private symbol = '';
  private size: number;
  private gameId: string;

  constructor(gameId: string, size: number) {
    this.gameId = gameId;
    this.size = size;
    const r = Math.round(size * 0.18);

    // Static drop shadow behind the tile for depth.
    this.shadow.roundRect(2, 4, size, size, r).fill({ color: 0x000000, alpha: 0.35 });

    const style = new TextStyle({
      fill: 0xffffff,
      fontSize: size * 0.52,
      fontWeight: '800',
      fontFamily: 'system-ui, sans-serif',
      stroke: { color: 0x000000, width: size * 0.04, alpha: 0.35 },
      dropShadow: { color: 0x000000, alpha: 0.4, blur: 2, distance: 2, angle: Math.PI / 2 }
    });
    this.glyph = new Text({ text: '', style });
    this.glyph.anchor.set(0.5);
    this.glyph.position.set(size / 2, size / 2);

    this.view.addChild(this.shadow, this.body, this.glyph);
    this.view.pivot.set(size / 2, size / 2);
  }

  /** Re-paint this tile for a (possibly new) symbol, reusing the same objects. */
  setSymbol(symbol: string): void {
    if (symbol === this.symbol) return;
    this.symbol = symbol;
    const skin = skinFor(this.gameId, symbol);
    const s = this.size;
    const r = Math.round(s * 0.18);
    const c = skin.color;

    this.body.clear();
    // Base.
    this.body.roundRect(0, 0, s, s, r).fill(c);
    // Glossy upper sheen.
    this.body.roundRect(0, 0, s, s * 0.56, r).fill({ color: lighten(c, 0.2), alpha: 0.9 });
    // Bottom shade for a rounded, lit-from-above look.
    this.body.rect(0, s * 0.62, s, s * 0.38).fill({ color: darken(c, 0.28), alpha: 0.55 });
    // Specular highlight blob near the top.
    this.body.ellipse(s * 0.5, s * 0.2, s * 0.34, s * 0.13).fill({ color: 0xffffff, alpha: 0.22 });
    // Bevel: light inner top-left, dark border.
    this.body.roundRect(1.5, 1.5, s - 3, s - 3, r - 1).stroke({ width: 1.5, color: lighten(c, 0.5), alpha: 0.35 });
    this.body.roundRect(0.5, 0.5, s - 1, s - 1, r).stroke({ width: 1.5, color: darken(c, 0.45), alpha: 0.7 });
    // Premium symbols get a warm gold rim.
    if (skin.special) {
      this.body.roundRect(2.5, 2.5, s - 5, s - 5, r - 2).stroke({ width: 2, color: 0xffe39a, alpha: 0.95 });
    }

    this.glyph.text = skin.glyph;
    const long = skin.glyph.length > 2;
    (this.glyph.style as TextStyle).fontSize = long ? s * 0.3 : s * 0.56;
  }

  get currentSymbol(): string {
    return this.symbol;
  }

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
 * Pool of Tiles. The board never holds more than cols×rows tiles, but tumbles
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

function lighten(color: number, amt: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + 255 * amt);
  const g = Math.min(255, ((color >> 8) & 0xff) + 255 * amt);
  const b = Math.min(255, (color & 0xff) + 255 * amt);
  return (r << 16) | (g << 8) | b;
}
function darken(color: number, amt: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amt));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amt));
  const b = Math.max(0, (color & 0xff) * (1 - amt));
  return (r << 16) | (g << 8) | b;
}
