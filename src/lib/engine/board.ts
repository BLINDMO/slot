import type { Board, Cell, SymbolId } from './types';
import type { Rng } from './rng';

/** Symbol-weight table for a weighted-random fill (used by cluster games). */
export interface WeightTable {
  symbols: SymbolId[];
  weights: number[];
}

/** Fill a fresh cols×rows board by weighted-random draw per cell. */
export function fillBoard(rng: Rng, cols: number, rows: number, wt: WeightTable): Board {
  const board: Board = [];
  for (let c = 0; c < cols; c++) {
    const column: SymbolId[] = [];
    for (let r = 0; r < rows; r++) column.push(rng.weighted(wt.symbols, wt.weights));
    board.push(column);
  }
  return board;
}

/** Deep copy a board. */
export function cloneBoard(board: Board): Board {
  return board.map((col) => col.slice());
}

/** Count occurrences of a symbol across the whole board, returning the cells. */
export function findCells(board: Board, symbol: SymbolId): Cell[] {
  const cells: Cell[] = [];
  for (let c = 0; c < board.length; c++)
    for (let r = 0; r < board[c].length; r++)
      if (board[c][r] === symbol) cells.push({ col: c, row: r });
  return cells;
}

/**
 * Flood-fill clusters of orthogonally-connected matching symbols.
 * `wilds` substitute for any cluster symbol (they join an adjacent cluster).
 * Returns one group per cluster, each a list of cells. A wild-only group is
 * not returned (wilds never form their own paying cluster).
 */
export function findClusters(
  board: Board,
  isWild: (s: SymbolId) => boolean,
  isPaying: (s: SymbolId) => boolean
): { symbol: SymbolId; cells: Cell[] }[] {
  const cols = board.length;
  const rows = board[0].length;
  const seen: boolean[][] = board.map((col) => col.map(() => false));
  const clusters: { symbol: SymbolId; cells: Cell[] }[] = [];

  const neighbors = (c: number, r: number): Cell[] => {
    const out: Cell[] = [];
    if (c > 0) out.push({ col: c - 1, row: r });
    if (c < cols - 1) out.push({ col: c + 1, row: r });
    if (r > 0) out.push({ col: c, row: r - 1 });
    if (r < rows - 1) out.push({ col: c, row: r + 1 });
    return out;
  };

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const sym = board[c][r];
      if (seen[c][r] || isWild(sym) || !isPaying(sym)) continue;
      // BFS over cells that are either this symbol or a wild.
      const cells: Cell[] = [];
      const queue: Cell[] = [{ col: c, row: r }];
      seen[c][r] = true;
      while (queue.length) {
        const cur = queue.pop()!;
        cells.push(cur);
        for (const n of neighbors(cur.col, cur.row)) {
          if (seen[n.col][n.row]) continue;
          const ns = board[n.col][n.row];
          if (ns === sym || isWild(ns)) {
            seen[n.col][n.row] = true;
            queue.push(n);
          }
        }
      }
      // A cluster that is purely wilds can't anchor on a paying symbol; since we
      // only start BFS from non-wild paying cells, `sym` is always a real symbol.
      clusters.push({ symbol: sym, cells });
    }
  }
  return clusters;
}

/**
 * Apply tumble/cascade gravity: remove `cleared` cells, drop everything above
 * down, and refill the gaps at the top with fresh weighted-random symbols.
 * Returns a new board (does not mutate the input).
 */
export function tumble(rng: Rng, board: Board, cleared: Cell[], wt: WeightTable): Board {
  const next = cloneBoard(board);
  const clearedByCol = new Map<number, Set<number>>();
  for (const cell of cleared) {
    if (!clearedByCol.has(cell.col)) clearedByCol.set(cell.col, new Set());
    clearedByCol.get(cell.col)!.add(cell.row);
  }
  for (const [col, rowsSet] of clearedByCol) {
    const rows = next[col].length;
    // Keep survivors in order, then pad the top with new symbols.
    const survivors: SymbolId[] = [];
    for (let r = 0; r < rows; r++) if (!rowsSet.has(r)) survivors.push(next[col][r]);
    const newCount = rows - survivors.length;
    const fresh: SymbolId[] = [];
    for (let i = 0; i < newCount; i++) fresh.push(rng.weighted(wt.symbols, wt.weights));
    next[col] = [...fresh, ...survivors];
  }
  return next;
}
