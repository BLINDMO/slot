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
      fontWeight: '800',
      fontFamily: 'Inter, system-ui, sans-serif',
      stroke: { color: 0x10203a, width: Math.min(w, h) * 0.05, alpha: 0.4 },
      dropShadow: { color: 0x000000, alpha: 0.45, blur: 2, distance: 2, angle: Math.PI / 2 }
    });
    this.glyph = new Text({ text: '', style });
    this.glyph.anchor.set(0.5);
    this.glyph.position.set(w / 2, h / 2);

    // The vector icon is drawn into its own Graphics, centered on the tile.
    this.icon.position.set(w / 2 - Math.min(w, h) / 2, h / 2 - Math.min(w, h) / 2);
    this.icon.scale.set(1);

    this.view.addChild(this.shadow, this.body, this.icon, this.glyph);
    this.view.pivot.set(w / 2, h / 2);
  }

  setSymbol(symbol: string): void {
    if (symbol === this.symbol) return;
    this.symbol = symbol;
    const skin = skinFor(this.gameId, symbol);
    const { w, h } = this;
    const r = Math.round(Math.min(w, h) * 0.18);
    const c = skin.color;

    this.body.clear();
    this.body.roundRect(0, 0, w, h, r).fill(c);
    this.body.roundRect(0, 0, w, h * 0.56, r).fill({ color: lighten(c, 0.2), alpha: 0.9 });
    this.body.rect(0, h * 0.62, w, h * 0.38).fill({ color: darken(c, 0.28), alpha: 0.55 });
    this.body.ellipse(w * 0.5, h * 0.2, w * 0.34, h * 0.13).fill({ color: 0xffffff, alpha: 0.22 });
    this.body.roundRect(1.5, 1.5, w - 3, h - 3, r - 1).stroke({ width: 1.5, color: lighten(c, 0.5), alpha: 0.35 });
    this.body.roundRect(0.5, 0.5, w - 1, h - 1, r).stroke({ width: 1.5, color: darken(c, 0.45), alpha: 0.7 });
    if (skin.special) {
      this.body.roundRect(2.5, 2.5, w - 5, h - 5, r - 2).stroke({ width: 2, color: 0xffe39a, alpha: 0.95 });
    }

    if (skin.motif === 'text') {
      const label = skin.label ?? '?';
      this.icon.clear();
      this.glyph.visible = true;
      this.glyph.text = label;
      (this.glyph.style as TextStyle).fontSize = (label.length > 2 ? 0.3 : 0.56) * Math.min(w, h);
    } else {
      this.glyph.visible = false;
      drawSymbol(this.icon, skin.motif, Math.min(w, h));
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
