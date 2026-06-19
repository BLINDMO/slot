import type { Board, Cell, SymbolId, WinPart } from './types';

/**
 * A payline is an array of row indices, one per column, defining the path the
 * line takes across the reels. Length must equal the number of columns.
 */
export type Payline = number[];

/** Left-to-right paytable: payout[symbol][matchCount] in bet-multiples. */
export type LinePaytable = Record<SymbolId, Record<number, number>>;

/**
 * Evaluate left-to-right line wins (the classic model). A line pays the longest
 * run of a single symbol starting from reel 0, with wilds substituting. Only the
 * single best symbol per line pays (standard rule). Returns one WinPart per
 * winning line.
 */
export function evaluateLines(
  board: Board,
  lines: Payline[],
  paytable: LinePaytable,
  isWild: (s: SymbolId) => boolean
): WinPart[] {
  const parts: WinPart[] = [];
  const cols = board.length;

  for (const line of lines) {
    // Symbols along the line, reel by reel.
    const lineSymbols: SymbolId[] = [];
    for (let c = 0; c < cols; c++) lineSymbols.push(board[c][line[c]]);

    // Determine the paying symbol: first non-wild, or wild if the whole run is wild.
    let target: SymbolId | null = null;
    for (const s of lineSymbols) {
      if (!isWild(s)) {
        target = s;
        break;
      }
    }
    if (target === null) target = lineSymbols[0]; // all wild

    // Count the matching run from reel 0.
    let run = 0;
    for (let c = 0; c < cols; c++) {
      const s = lineSymbols[c];
      if (s === target || isWild(s)) run++;
      else break;
    }

    const pay = paytable[target]?.[run];
    if (pay && pay > 0) {
      const cells: Cell[] = [];
      for (let c = 0; c < run; c++) cells.push({ col: c, row: line[c] });
      parts.push({ symbol: target, cells, count: run, baseWin: pay, win: pay });
    }
  }
  return parts;
}
