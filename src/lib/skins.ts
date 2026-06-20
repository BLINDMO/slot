/**
 * Symbol skins: a plate colour + a vector MOTIF per symbol, per game. Motifs are
 * drawn as crisp vector graphics in PixiJS (see render/symbols.ts) — no emoji.
 * "Text" motifs (WILD/BONUS/VS/BAR/SEVEN) render their `label` as styled type.
 */
export type Motif =
  | 'coin' | 'compass' | 'sword' | 'skull' | 'anchor'
  | 'spade' | 'heart' | 'diamond' | 'club'
  | 'star' | 'revolver' | 'hat' | 'gem'
  | 'cherry' | 'lemon' | 'grape' | 'bell'
  | 'text';

export interface SymbolSkin {
  color: number; // PixiJS hex plate colour
  motif: Motif;
  /** For motif === 'text': the word/letter to render. */
  label?: string;
  /** Premium/wild/scatter get a brighter, gold-rimmed treatment. */
  special?: boolean;
}

export type Skin = Record<string, SymbolSkin>;

export const SKINS: Record<string, Skin> = {
  blackwaterBay: {
    L1: { color: 0x2f7d6b, motif: 'coin' },
    L2: { color: 0x356d8a, motif: 'compass' },
    L3: { color: 0x7a5ca8, motif: 'sword' },
    H1: { color: 0xd64545, motif: 'skull', special: true },
    H2: { color: 0xc98a2b, motif: 'anchor', special: true },
    W: { color: 0x2fbf71, motif: 'text', label: 'WILD', special: true },
    S: { color: 0xe8c468, motif: 'text', label: 'BONUS', special: true }
  },
  highNoon: {
    L1: { color: 0x4f6a8a, motif: 'spade' },
    L2: { color: 0xa14a3a, motif: 'heart' },
    L3: { color: 0x3f7d8a, motif: 'diamond' },
    L4: { color: 0x5b7a3f, motif: 'club' },
    H1: { color: 0xe0a83d, motif: 'star', special: true },
    H2: { color: 0xb5651d, motif: 'revolver', special: true },
    H3: { color: 0x9b3b2f, motif: 'hat', special: true },
    WILD: { color: 0x2fbf71, motif: 'text', label: 'WILD', special: true },
    VS: { color: 0xe6504f, motif: 'text', label: 'VS', special: true }
  },
  luckySevens: {
    CHERRY: { color: 0xd64545, motif: 'cherry' },
    LEMON: { color: 0xe0b53d, motif: 'lemon' },
    PLUM: { color: 0x8a4fd0, motif: 'grape' },
    BELL: { color: 0xe8c468, motif: 'bell', special: true },
    BAR: { color: 0x3f5d7a, motif: 'text', label: 'BAR', special: true },
    SEVEN: { color: 0xd64545, motif: 'text', label: '7', special: true },
    WILD: { color: 0x2fbf71, motif: 'gem', special: true }
  }
};

const FALLBACK: SymbolSkin = { color: 0x3a4252, motif: 'text', label: '?' };

export function skinFor(gameId: string, symbol: string): SymbolSkin {
  return SKINS[gameId]?.[symbol] ?? FALLBACK;
}
