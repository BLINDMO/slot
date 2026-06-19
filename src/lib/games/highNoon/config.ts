import type { LinePaytable, Payline } from '$engine/paylines';
import type { WeightTable } from '$engine/board';
import type { GameMeta } from '$engine/types';

export const COLS = 5;
export const ROWS = 3;

export const WILD = 'WILD';
export const VS = 'VS'; // duel trigger symbol (does not pay lines)

/** Uniform weighted strip applied to every cell (independent reels). */
export const WEIGHTS: WeightTable = {
  symbols: ['H1', 'H2', 'H3', 'L1', 'L2', 'L3', 'L4', WILD, VS],
  weights: [6, 8, 10, 16, 18, 20, 22, 4, 0.85]
};

/** Left-to-right line pays in bet-multiples, before PAY_SCALE. WILD is pure substitute. */
export const BASE_PAYTABLE: LinePaytable = {
  // Premiums pay from 3; lows pay from 4 only, which keeps hit frequency in the
  // ~28% band for a 25-line game (low 3-of-a-kinds would otherwise dominate).
  H1: { 3: 5, 4: 20, 5: 100 },
  H2: { 3: 4, 4: 12, 5: 60 },
  H3: { 3: 3, 4: 8, 5: 40 },
  L1: { 3: 0.4, 4: 4, 5: 15 },
  L2: { 4: 3, 5: 12 },
  L3: { 4: 2.5, 5: 10 },
  L4: { 4: 2, 5: 8 }
};

/** Global scale applied to every paytable value to hit target RTP (see sim). */
export const PAY_SCALE = 0.3440;

export const PAYTABLE: LinePaytable = Object.fromEntries(
  Object.entries(BASE_PAYTABLE).map(([sym, tiers]) => [
    sym,
    Object.fromEntries(Object.entries(tiers).map(([n, pay]) => [n, pay * PAY_SCALE]))
  ])
);

/** 25 paylines across a 5×3 grid. */
export const LINES: Payline[] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 0, 2, 0, 0],
  [2, 2, 0, 2, 2],
  [0, 2, 2, 2, 0],
  [2, 0, 0, 0, 2],
  [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2],
  [1, 0, 2, 0, 1],
  [1, 2, 0, 2, 1]
];

/** 2+ VS symbols trigger the duel and free spins. */
export const VS_TRIGGER = 2;
export const FREE_SPINS = 6;
export const RETRIGGER_VS = 2;
export const RETRIGGER_SPINS = 2;

/** Sticky expanding-wild multiplier: starts here, escalates each free spin. */
export const WILD_MULT_START = 1;
export const WILD_MULT_STEP = 1;

export const MAX_WIN = 12500;

export const META: GameMeta = {
  id: 'highNoon',
  title: 'High Noon',
  theme: 'Wild west duel',
  mechanic: 'VS duel awards an escalating-multiplier sticky expanding wild in free spins',
  volatility: 'High',
  targetRtp: 0.964,
  targetHitFreq: 0.28,
  maxWin: MAX_WIN,
  bonusBuyCost: 120,
  color: '#b5651d',
  playable: true
};
