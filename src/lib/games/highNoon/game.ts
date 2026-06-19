import type { Rng } from '$engine/rng';
import type { Board, Book, BookEvent, Game, SpinOptions, SymbolContribution } from '$engine/types';
import { fillBoard, findCells, cloneBoard } from '$engine/board';
import { evaluateLines } from '$engine/paylines';
import * as C from './config';

const isWild = (s: string) => s === C.WILD;

function fill(rng: Rng): Board {
  return fillBoard(rng, C.COLS, C.ROWS, C.WEIGHTS);
}

/** Force one reel column to be fully wild (the sticky expanding wild). */
function applyExpandingWild(board: Board, reel: number): Board {
  const next = cloneBoard(board);
  for (let r = 0; r < next[reel].length; r++) next[reel][r] = C.WILD;
  return next;
}

class Tally {
  total = 0;
  peakMult = 1;
  symbolWins: SymbolContribution = {};
  add(sym: string, amt: number) {
    this.total += amt;
    this.symbolWins[sym] = (this.symbolWins[sym] ?? 0) + amt;
  }
}

function scoreBoard(board: Board, multiplier: number, tally: Tally, events: BookEvent[]): void {
  const parts = evaluateLines(board, C.LINES, C.PAYTABLE, isWild);
  if (parts.length === 0) return;
  let stepWin = 0;
  for (const p of parts) {
    const win = p.win * multiplier;
    p.win = win; // surface the multiplied value to the renderer
    stepWin += win;
    tally.add(p.symbol, win);
  }
  events.push({ type: 'wins', parts, stepWin });
}

function runFreeSpins(rng: Rng, tally: Tally, events: BookEvent[]): void {
  // Pick the reel that becomes the sticky expanding wild for the whole feature.
  const wildReel = rng.int(C.COLS);
  let spins = C.FREE_SPINS;
  let done = 0;
  let mult = C.WILD_MULT_START;

  events.push({ type: 'feature', name: 'duel', data: { wildReel } });
  events.push({ type: 'freeSpinsStart', count: spins });

  while (done < spins) {
    done++;
    events.push({ type: 'freeSpinIndex', index: done, total: spins });
    events.push({ type: 'globalMultiplier', value: mult });
    tally.peakMult = Math.max(tally.peakMult, mult);

    const board = applyExpandingWild(fill(rng), wildReel);
    events.push({ type: 'reveal', board });
    scoreBoard(board, mult, tally, events);

    // VS landing on the non-wild reels can retrigger more spins.
    const vs = findCells(board, C.VS);
    if (vs.length >= C.RETRIGGER_VS) {
      spins += C.RETRIGGER_SPINS;
      events.push({ type: 'scatter', cells: vs, count: vs.length });
      events.push({ type: 'freeSpinsAwarded', count: C.RETRIGGER_SPINS });
    }

    // The sticky wild's multiplier escalates each spin it survives.
    mult += C.WILD_MULT_STEP;
  }
  events.push({ type: 'freeSpinsEnd' });
}

export const highNoon: Game = {
  meta: C.META,
  layout: { cols: C.COLS, rows: C.ROWS },
  preview(rng: Rng): Board {
    return fill(rng);
  },
  spin(rng: Rng, options: SpinOptions = {}): Book {
    const events: BookEvent[] = [];
    const tally = new Tally();
    const bonusBuy = options.bonusBuy === true;
    let bonusTriggered = false;

    if (bonusBuy) {
      bonusTriggered = true;
      events.push({ type: 'feature', name: 'bonusBuy' });
      runFreeSpins(rng, tally, events);
    } else {
      const board = fill(rng);
      events.push({ type: 'reveal', board });
      scoreBoard(board, 1, tally, events);

      const vs = findCells(board, C.VS);
      if (vs.length >= C.VS_TRIGGER) {
        bonusTriggered = true;
        events.push({ type: 'scatter', cells: vs, count: vs.length });
        runFreeSpins(rng, tally, events);
      }
    }

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
