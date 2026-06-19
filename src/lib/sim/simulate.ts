import type { Game, SpinOptions } from '$engine/types';
import { mulberry32 } from '$engine/rng';

export interface SimResult {
  gameId: string;
  spins: number;
  rtp: number;
  hitFrequency: number;
  bonusFrequency: number;
  maxWin: number;
  /** Standard deviation of per-spin win in bet-multiples — a volatility proxy. */
  volatility: number;
  /** Win-size distribution: count of spins whose win falls in each bucket. */
  buckets: { label: string; count: number }[];
  /** Aggregate per-symbol payout contribution. */
  symbolWins: Record<string, number>;
}

const BUCKET_EDGES = [0, 0.0001, 1, 2, 5, 10, 20, 50, 100, 500, 1000, Infinity];
function bucketLabel(i: number): string {
  const lo = BUCKET_EDGES[i];
  const hi = BUCKET_EDGES[i + 1];
  if (lo === 0 && hi <= 0.0001) return '0 (loss)';
  if (hi === Infinity) return `${lo}x+`;
  return `${lo}–${hi}x`;
}

/**
 * Run `spins` Monte Carlo spins of a game and aggregate the headline metrics.
 * Deterministic for a given seed. This is the validation gate from Section 5 of
 * the brief: a game's math isn't "done" until its measured RTP matches target.
 */
export function simulate(
  game: Game,
  spins: number,
  seed = 0x1234abcd,
  options: SpinOptions = {}
): SimResult {
  const rng = mulberry32(seed);
  let totalWin = 0;
  let hits = 0;
  let bonuses = 0;
  let maxWin = 0;
  let sumSq = 0;
  const buckets = new Array(BUCKET_EDGES.length - 1).fill(0);
  const symbolWins: Record<string, number> = {};

  for (let i = 0; i < spins; i++) {
    const book = game.spin(rng, options);
    const win = book.totalWin;
    totalWin += win;
    sumSq += win * win;
    if (win > 0) hits++;
    if (book.bonusTriggered) bonuses++;
    if (win > maxWin) maxWin = win;
    for (const [sym, amt] of Object.entries(book.symbolWins))
      symbolWins[sym] = (symbolWins[sym] ?? 0) + amt;
    // Bucket it.
    for (let b = 0; b < buckets.length; b++) {
      if (win >= BUCKET_EDGES[b] && win < BUCKET_EDGES[b + 1]) {
        buckets[b]++;
        break;
      }
    }
  }

  const mean = totalWin / spins;
  const variance = sumSq / spins - mean * mean;

  return {
    gameId: game.meta.id,
    spins,
    rtp: mean,
    hitFrequency: hits / spins,
    bonusFrequency: bonuses / spins,
    maxWin,
    volatility: Math.sqrt(Math.max(0, variance)),
    buckets: buckets.map((count, i) => ({ label: bucketLabel(i), count })),
    symbolWins
  };
}
