import type { Board, SymbolId, WinPart } from './types';
import { findClusters } from './board';

/**
 * Cluster paytable: payout in bet-multiples keyed by symbol, then by a cluster
 * size tier. The tier is the *minimum* cluster size that qualifies for that pay;
 * a cluster pays the highest tier it meets or exceeds.
 *
 * Example: { H1: { 8: 1.0, 10: 2.5, 12: 6, 15: 25 } }
 */
export type ClusterPaytable = Record<SymbolId, Record<number, number>>;

/** Minimum cluster size that pays anything (cluster-pays convention is 8). */
export const MIN_CLUSTER = 8;

function payoutFor(table: Record<number, number> | undefined, size: number): number {
  if (!table) return 0;
  let best = 0;
  for (const tierStr of Object.keys(table)) {
    const tier = Number(tierStr);
    if (size >= tier) best = Math.max(best, table[tier]);
  }
  return best;
}

/**
 * Evaluate all paying clusters on a board. `globalMultiplier` (>= 1) is applied
 * to every win — this is how the free-spin multiplier trail boosts payouts.
 */
export function evaluateClusters(
  board: Board,
  paytable: ClusterPaytable,
  isWild: (s: SymbolId) => boolean,
  globalMultiplier = 1
): WinPart[] {
  const clusters = findClusters(board, isWild, (s) => paytable[s] !== undefined);
  const parts: WinPart[] = [];
  for (const cluster of clusters) {
    if (cluster.cells.length < MIN_CLUSTER) continue;
    const base = payoutFor(paytable[cluster.symbol], cluster.cells.length);
    if (base <= 0) continue;
    parts.push({
      symbol: cluster.symbol,
      cells: cluster.cells,
      count: cluster.cells.length,
      baseWin: base,
      win: base * globalMultiplier
    });
  }
  return parts;
}
