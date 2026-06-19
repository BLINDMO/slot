/**
 * Symbol skins: a color + glyph per symbol id, per game. Glyphs are emoji where
 * possible — on iOS Safari these render in full Apple Color Emoji, which gives
 * "fun icons" for free without shipping art. Text glyphs (WILD/BONUS/7/BAR/VS)
 * stay as words because their function must read instantly.
 *
 * This is the swap point for the eventual bespoke art pass — replace glyph with a
 * sprite texture and the renderer/math are untouched.
 */
export interface SymbolSkin {
  color: number; // PixiJS hex color
  glyph: string;
  /** Premium/wild/scatter get a brighter, gold-rimmed treatment. */
  special?: boolean;
}

export type Skin = Record<string, SymbolSkin>;

export const SKINS: Record<string, Skin> = {
  blackwaterBay: {
    L1: { color: 0x2f7d6b, glyph: '🪙' },
    L2: { color: 0x356d8a, glyph: '🧭' },
    L3: { color: 0x7a5ca8, glyph: '🗡️' },
    H1: { color: 0xd64545, glyph: '💀', special: true },
    H2: { color: 0xc98a2b, glyph: '⚓', special: true },
    W: { color: 0x2fbf71, glyph: 'WILD', special: true },
    S: { color: 0xe8c468, glyph: 'BONUS', special: true }
  },
  highNoon: {
    L1: { color: 0x6f7d3e, glyph: '♠️' },
    L2: { color: 0xa14a3a, glyph: '♥️' },
    L3: { color: 0x3f6d7a, glyph: '♦️' },
    L4: { color: 0x7a5b3f, glyph: '♣️' },
    H1: { color: 0xe0a83d, glyph: '⭐', special: true },
    H2: { color: 0xb5651d, glyph: '🔫', special: true },
    H3: { color: 0x9b3b2f, glyph: '🤠', special: true },
    WILD: { color: 0x2fbf71, glyph: 'WILD', special: true },
    VS: { color: 0xe6504f, glyph: 'VS', special: true }
  },
  luckySevens: {
    CHERRY: { color: 0xd64545, glyph: '🍒' },
    LEMON: { color: 0xe0b53d, glyph: '🍋' },
    PLUM: { color: 0x8a4fd0, glyph: '🍇' },
    BELL: { color: 0xe8c468, glyph: '🔔', special: true },
    BAR: { color: 0x3f5d7a, glyph: 'BAR', special: true },
    SEVEN: { color: 0xd64545, glyph: '7', special: true },
    WILD: { color: 0x2fbf71, glyph: '💎', special: true }
  }
};

const FALLBACK: SymbolSkin = { color: 0x3a4252, glyph: '?' };

export function skinFor(gameId: string, symbol: string): SymbolSkin {
  return SKINS[gameId]?.[symbol] ?? FALLBACK;
}
