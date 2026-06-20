import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { skinFor } from '../skins';
import { drawSymbol } from './symbols';

/**
 * A reusable, retained-mode board tile. Created once and re-skinned in place so a
 * tumble step or fresh spin never allocates a Text/Graphics (the old renderer's
 * worst GC offender, and costly on iOS Safari).
 *
 * The symbol artwork is crisp vector graphics (render/symbols.ts), not emoji.
 * Cells can be non-square so boards fill tall phone screens.
 */
export class Tile {
  readonly view = new Container();
  private shadow = new Graphics();
  private body = new Graphics();
  private icon = new Graphics();
  private glyph: Text;
  private symbol = '';
  private w: number;
  private h: number;
  private gameId: string;

  constructor(gameId: string, w: number, h: number) {
    this.gameId = gameId;
    this.w = w;
    this.h = h;
    const r = Math.round(Math.min(w, h) * 0.18);

    this.shadow.roundRect(2, 4, w, h, r).fill({ color: 0x000000, alpha: 0.35 });

    const style = new TextStyle({
      fill: 0xffffff,
      fontSize: Math.min(w, h) * 0.46,
      fontWeight: '900',
      fontFamily: 'Inter, system-ui, sans-serif',
      dropShadow: { color: 0x000000, alpha: 0.5, blur: 3, distance: 2, angle: Math.PI / 2 }
    });
    this.glyph = new Text({ text: '', style });
    this.glyph.anchor.set(0.5);
    this.glyph.position.set(w / 2, h / 2);

    // The vector icon is drawn into its own Graphics, centered & slightly larger.
    const s = Math.min(w, h) * 1.06;
    this.icon.position.set(w / 2 - s / 2, h / 2 - s / 2);
    this.iconSize = s;

    this.view.addChild(this.shadow, this.body, this.icon, this.glyph);
    this.view.pivot.set(w / 2, h / 2);
  }

  private iconSize = 64;

  setSymbol(symbol: string): void {
    if (symbol === this.symbol) return;
    this.symbol = symbol;
    const skin = skinFor(this.gameId, symbol);
    const { w, h } = this;
    const r = Math.round(Math.min(w, h) * 0.2);
    const c = skin.color;

    // Dark glass gem cell with a neon edge tinted by the symbol's accent colour.
    this.body.clear();
    // soft outer glow halo in the accent colour
    this.body.roundRect(-3, -2, w + 6, h + 6, r + 3).fill({ color: c, alpha: skin.special ? 0.16 : 0.08 });
    // glass base (deep indigo tinted with the accent)
    this.body.roundRect(0, 0, w, h, r).fill(mix(0x120e26, c, 0.16));
    // top vertical sheen
    this.body.roundRect(0, 0, w, h * 0.5, r).fill({ color: 0xffffff, alpha: 0.06 });
    this.body.ellipse(w * 0.5, h * 0.16, w * 0.4, h * 0.1).fill({ color: 0xffffff, alpha: 0.1 });
    // inner light rim + neon edge
    this.body.roundRect(1.5, 1.5, w - 3, h - 3, r - 1).stroke({ width: 1.2, color: 0xffffff, alpha: 0.12 });
    this.body.roundRect(0.75, 0.75, w - 1.5, h - 1.5, r).stroke({
      width: skin.special ? 2.4 : 1.6,
      color: c,
      alpha: skin.special ? 0.95 : 0.7
    });

    if (skin.motif === 'text') {
      const label = skin.label ?? '?';
      this.icon.clear();
      this.glyph.visible = true;
      this.glyph.text = label;
      (this.glyph.style as TextStyle).fill = c;
      (this.glyph.style as TextStyle).fontSize = (label.length > 2 ? 0.32 : 0.62) * Math.min(w, h);
    } else {
      this.glyph.visible = false;
      drawSymbol(this.icon, skin.motif, this.iconSize);
    }
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

export class TilePool {
  private free: Tile[] = [];
  private gameId: string;
  private w: number;
  private h: number;

  constructor(gameId: string, w: number, h: number) {
    this.gameId = gameId;
    this.w = w;
    this.h = h;
  }

  acquire(symbol: string): Tile {
    const t = this.free.pop() ?? new Tile(this.gameId, this.w, this.h);
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

/** Blend `a` toward `b` by t (0..1). */
function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
