import type { ClusterPaytable } from '$engine/cluster';
import type { WeightTable } from '$engine/board';
import type { GameMeta } from '$engine/types';

export const COLS = 6;
export const ROWS = 5;

export const WILD = 'W';
export const SCATTER = 'S';

/**
 * Board fill weights. Tuned against the Monte Carlo simulator (see
 * `npm run sim blackwaterBay`) to land near the target RTP. Scatter and wild are
 * rare; low symbols (L*) are common so clusters form often (high hit frequency)
 * but most are small, with the long tail coming from tumble chains + the
 * free-spin multiplier trail.
 */
export const WEIGHTS: WeightTable = {
  // Cluster pays on a 6×5 grid needs few distinct symbols and plenty of wilds,
  // or 8-connected clusters never form. 5 paying symbols + a heavy wild presence
  // gives a ~25% hit frequency (validated by the simulator).
  symbols: ['L1', 'L2', 'L3', 'H1', 'H2', WILD, SCATTER],
  weights: [44, 40, 34, 22, 16, 22, 4.3]
};

/**
 * Cluster paytable in bet-multiples, keyed by symbol then minimum cluster size.
 * Shape was tuned for hit frequency; the absolute values are then scaled so the
 * measured RTP lands on target (RTP is linear in these numbers).
 */
export const PAYTABLE: ClusterPaytable = {
  // Premiums.
  H1: { 8: 1.0, 10: 2.5, 12: 7.5, 15: 30 },
  H2: { 8: 0.8, 10: 2.0, 12: 6.0, 15: 24 },
  // Lows.
  L1: { 8: 0.4, 10: 0.9, 12: 2.4, 15: 9 },
  L2: { 8: 0.35, 10: 0.8, 12: 2.0, 15: 7.5 },
  L3: { 8: 0.3, 10: 0.7, 12: 1.7, 15: 6 }
};

/** Global scale applied to every paytable value to hit target RTP (see sim). */
export const PAY_SCALE = 2.493;

/** Paytable with the RTP scale baked in — this is what the game evaluates. */
export const SCALED_PAYTABLE: ClusterPaytable = Object.fromEntries(
  Object.entries(PAYTABLE).map(([sym, tiers]) => [
    sym,
    Object.fromEntries(Object.entries(tiers).map(([size, pay]) => [size, pay * PAY_SCALE]))
  ])
);

/** Minimum scatters on the initial board to trigger free spins. */
export const SCATTER_TRIGGER = 4;
/** Free spins awarded at the trigger, plus extra per scatter beyond the trigger. */
export const FREE_SPINS_BASE = 10;
export const FREE_SPINS_PER_EXTRA = 2;
/** Scatters needed during free spins to retrigger more spins. */
export const RETRIGGER = 3;
export const RETRIGGER_SPINS = 5;

/** Hard cap on a single round's win, in bet-multiples. */
export const MAX_WIN = 5000;

export const META: GameMeta = {
  id: 'blackwaterBay',
  title: 'Blackwater Bay',
  theme: 'Tropical pirate / shipwreck',
  mechanic: 'Cluster pays + tumbles; free spins build an accumulating multiplier trail',
  volatility: 'High',
  targetRtp: 0.965,
  targetHitFreq: 0.25,
  maxWin: MAX_WIN,
  bonusBuyCost: 100,
  color: '#1f9e89',
  playable: true
};
