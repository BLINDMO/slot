import type { LinePaytable, Payline } from '$engine/paylines';
import type { WeightTable } from '$engine/board';
import type { GameMeta } from '$engine/types';

export const COLS = 3;
export const ROWS = 3;

export const WILD = 'WILD';

/** Per-reel weighted strips. Classic 3-reel feel: high symbols are rare. */
export const WEIGHTS: WeightTable = {
  symbols: ['CHERRY', 'LEMON', 'PLUM', 'BELL', 'BAR', 'SEVEN', WILD],
  weights: [30, 28, 24, 18, 12, 7, 4]
};

/**
 * Left-to-right line pays, in bet-multiples, keyed by symbol then match count.
 * Mostly 3-of-a-kind to keep hit frequency in the classic ~42% band; only the
 * cherry pays short (the traditional "cherries always pay something") and the
 * top symbols pay a teaser on 2. Values are scaled by PAY_SCALE to hit RTP.
 */
export const BASE_PAYTABLE: LinePaytable = {
  WILD: { 3: 200 },
  SEVEN: { 2: 4, 3: 100 },
  BAR: { 2: 2, 3: 50 },
  BELL: { 3: 25 },
  PLUM: { 3: 15 },
  LEMON: { 3: 10 },
  CHERRY: { 2: 1, 3: 8 }
};

/** 5 lines across a 3×3 grid: 3 horizontals + 2 diagonals. */
export const LINES: Payline[] = [
  [1, 1, 1], // middle row
  [0, 0, 0], // top row
  [2, 2, 2], // bottom row
  [0, 1, 2], // \ diagonal
  [2, 1, 0] // / diagonal
];

/** Global scale applied to every paytable value to hit target RTP (see sim). */
export const PAY_SCALE = 0.2013;

/** Paytable with the RTP scale baked in — this is what the game evaluates. */
export const PAYTABLE: LinePaytable = Object.fromEntries(
  Object.entries(BASE_PAYTABLE).map(([sym, tiers]) => [
    sym,
    Object.fromEntries(Object.entries(tiers).map(([n, pay]) => [n, pay * PAY_SCALE]))
  ])
);

/** Max win in bet-multiples (covers the 5-line wild jackpot). */
export const MAX_WIN = 1000;

/** Gamble: double-or-nothing, slightly house-favoured so it stays RTP-neutral-ish. */
export const GAMBLE_WIN_CHANCE = 0.48;
export const GAMBLE_MAX_STEPS = 5;

export const META: GameMeta = {
  id: 'luckySevens',
  title: 'Lucky Sevens',
  theme: 'Classic retro arcade',
  mechanic: '3×3 fruit machine with a double-or-nothing gamble wheel after wins',
  volatility: 'Medium',
  targetRtp: 0.96,
  targetHitFreq: 0.42,
  maxWin: MAX_WIN,
  bonusBuyCost: null,
  color: '#e0a83d',
  playable: true
};
