import type { Rng } from '$engine/rng';
import type { Board, Book, BookEvent, Cell, Game, SpinOptions, SymbolContribution } from '$engine/types';
import { fillBoard, findCells, tumble } from '$engine/board';
import { evaluateClusters } from '$engine/cluster';
import * as C from './config';

const isWild = (s: string) => s === C.WILD;

/** Accumulates wins, peak multiplier, and per-symbol contribution as a round runs. */
class Tally {
  total = 0;
  peakMult = 1;
  symbolWins: SymbolContribution = {};
  add(symbol: string, amount: number) {
    this.total += amount;
    this.symbolWins[symbol] = (this.symbolWins[symbol] ?? 0) + amount;
  }
}

/**
 * Run the tumble/cascade loop on a board until no more wins. Returns the events
 * produced and mutates the tally. `multiplierState.value` is the live global
 * multiplier; if `accumulate` is true it increments by 1 after each winning
 * tumble step (the free-spin "multiplier trail").
 */
function runTumbles(
  rng: Rng,
  startBoard: Board,
  tally: Tally,
  multiplierState: { value: number },
  accumulate: boolean,
  events: BookEvent[]
): void {
  let board = startBoard;
  while (true) {
    const parts = evaluateClusters(board, C.SCALED_PAYTABLE, isWild, multiplierState.value);
    if (parts.length === 0) break;

    let stepWin = 0;
    for (const p of parts) {
      stepWin += p.win;
      tally.add(p.symbol, p.win);
    }
    events.push({ type: 'wins', parts, stepWin });

    const cleared: Cell[] = parts.flatMap((p) => p.cells);
    board = tumble(rng, board, cleared, C.WEIGHTS);
    events.push({ type: 'tumble', cleared, board });

    if (accumulate) {
      multiplierState.value += 1;
      tally.peakMult = Math.max(tally.peakMult, multiplierState.value);
      events.push({ type: 'globalMultiplier', value: multiplierState.value });
    }
  }
}

function countScatters(board: Board): Cell[] {
  return findCells(board, C.SCATTER);
}

function runFreeSpins(rng: Rng, count: number, tally: Tally, events: BookEvent[]): void {
  let remaining = count;
  let done = 0;
  // The multiplier trail persists across the entire free-spins session.
  const multiplierState = { value: 1 };
  events.push({ type: 'freeSpinsStart', count });

  while (remaining > 0) {
    remaining--;
    done++;
    events.push({ type: 'freeSpinIndex', index: done, total: count });

    const board = fillB(rng);
    events.push({ type: 'reveal', board });

    const scatters = countScatters(board);
    runTumbles(rng, board, tally, multiplierState, true, events);

    if (scatters.length >= C.RETRIGGER) {
      count += C.RETRIGGER_SPINS;
      remaining += C.RETRIGGER_SPINS;
      events.push({ type: 'scatter', cells: scatters, count: scatters.length });
      events.push({ type: 'freeSpinsAwarded', count: C.RETRIGGER_SPINS });
    }
  }
  events.push({ type: 'freeSpinsEnd' });
}

// Small helper so the call sites read cleanly.
function fillB(rng: Rng): Board {
  return fillBoard(rng, C.COLS, C.ROWS, C.WEIGHTS);
}

export const blackwaterBay: Game = {
  meta: C.META,
  layout: { cols: C.COLS, rows: C.ROWS },
  preview(rng: Rng): Board {
    return fillB(rng);
  },
  spin(rng: Rng, options: SpinOptions = {}): Book {
    const events: BookEvent[] = [];
    const tally = new Tally();
    const bonusBuy = options.bonusBuy === true;
    let bonusTriggered = false;
    let freeSpins = 0;

    if (bonusBuy) {
      // Buying skips the base game and drops straight into free spins.
      bonusTriggered = true;
      freeSpins = C.FREE_SPINS_BASE;
      events.push({ type: 'feature', name: 'bonusBuy', data: { spins: freeSpins } });
    } else {
      const board = fillB(rng);
      events.push({ type: 'reveal', board });

      const scatters = countScatters(board);
      // Base-game tumbles run at a flat 1x multiplier (no trail outside the bonus).
      runTumbles(rng, board, tally, { value: 1 }, false, events);

      if (scatters.length >= C.SCATTER_TRIGGER) {
        bonusTriggered = true;
        freeSpins =
          C.FREE_SPINS_BASE + (scatters.length - C.SCATTER_TRIGGER) * C.FREE_SPINS_PER_EXTRA;
        events.push({ type: 'scatter', cells: scatters, count: scatters.length });
        events.push({ type: 'freeSpinsAwarded', count: freeSpins });
      }
    }

    if (freeSpins > 0) runFreeSpins(rng, freeSpins, tally, events);

    // Apply the round-level max-win cap.
    let totalWin = tally.total;
    if (totalWin > C.MAX_WIN) totalWin = C.MAX_WIN;

    events.push({ type: 'finalWin', totalWin });

    return {
      events,
      totalWin,
      bonusTriggered,
      bonusBuy,
      peakMultiplier: tally.peakMult,
      symbolWins: tally.symbolWins
    };
  }
};
