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
    L1: { color: 0xffd24a, motif: 'coin' },
    L2: { color: 0x4fd0ff, motif: 'compass' },
    L3: { color: 0xc9d4e6, motif: 'sword' },
    H1: { color: 0xff3d9a, motif: 'skull', special: true },
    H2: { color: 0x2ee6ff, motif: 'anchor', special: true },
    W: { color: 0x27ff8d, motif: 'text', label: 'WILD', special: true },
    S: { color: 0xffd24a, motif: 'text', label: 'BONUS', special: true }
  },
  highNoon: {
    L1: { color: 0xc9d4e6, motif: 'spade' },
    L2: { color: 0xff4d6d, motif: 'heart' },
    L3: { color: 0x4fd0ff, motif: 'diamond' },
    L4: { color: 0x52e08a, motif: 'club' },
    H1: { color: 0xffd24a, motif: 'star', special: true },
    H2: { color: 0xc9d4e6, motif: 'revolver', special: true },
    H3: { color: 0xff9d3d, motif: 'hat', special: true },
    WILD: { color: 0x27ff8d, motif: 'text', label: 'WILD', special: true },
    VS: { color: 0xff3d9a, motif: 'text', label: 'VS', special: true }
  },
  luckySevens: {
    CHERRY: { color: 0xff4d5e, motif: 'cherry' },
    LEMON: { color: 0xffd84a, motif: 'lemon' },
    PLUM: { color: 0xb07bff, motif: 'grape' },
    BELL: { color: 0xffd24a, motif: 'bell', special: true },
    BAR: { color: 0x2ee6ff, motif: 'text', label: 'BAR', special: true },
    SEVEN: { color: 0xff4d6d, motif: 'text', label: '7', special: true },
    WILD: { color: 0x2ee6ff, motif: 'gem', special: true }
  }
};

const FALLBACK: SymbolSkin = { color: 0x3a4252, motif: 'text', label: '?' };

export function skinFor(gameId: string, symbol: string): SymbolSkin {
  return SKINS[gameId]?.[symbol] ?? FALLBACK;
}
