/**
 * Placeholder symbol skins: a color + short glyph per symbol id, per game. This
 * is the swap point for the asset pass (Section 7) — replace these with sprite
 * textures without touching the renderer or the math.
 */
export interface SymbolSkin {
  color: number; // PixiJS hex color
  glyph: string;
  /** Premium/wild/scatter get a brighter treatment. */
  special?: boolean;
}

export type Skin = Record<string, SymbolSkin>;

export const SKINS: Record<string, Skin> = {
  blackwaterBay: {
    L1: { color: 0x4f6d7a, glyph: '◆' },
    L2: { color: 0x5b8a72, glyph: '●' },
    L3: { color: 0x7a6f9b, glyph: '▲' },
    H1: { color: 0xd9a441, glyph: '☠', special: true },
    H2: { color: 0xc25b4d, glyph: '⚓', special: true },
    W: { color: 0x2fbf71, glyph: 'WILD', special: true },
    S: { color: 0xe8c468, glyph: 'BONUS', special: true }
  },
  luckySevens: {
    CHERRY: { color: 0xe6504f, glyph: '🍒' },
    LEMON: { color: 0xe8c468, glyph: '🍋' },
    PLUM: { color: 0x9b5de5, glyph: '🍇' },
    BELL: { color: 0xf2c14e, glyph: '🔔', special: true },
    BAR: { color: 0x4f6d7a, glyph: 'BAR', special: true },
    SEVEN: { color: 0xe6504f, glyph: '7', special: true },
    WILD: { color: 0x2fbf71, glyph: 'WILD', special: true }
  }
};

const FALLBACK: SymbolSkin = { color: 0x3a4252, glyph: '?' };

export function skinFor(gameId: string, symbol: string): SymbolSkin {
  return SKINS[gameId]?.[symbol] ?? FALLBACK;
}
