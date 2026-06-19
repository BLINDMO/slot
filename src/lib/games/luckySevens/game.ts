import type { Rng } from '$engine/rng';
import type { Board, Book, BookEvent, Game, SpinOptions, SymbolContribution } from '$engine/types';
import { fillBoard } from '$engine/board';
import { evaluateLines } from '$engine/paylines';
import * as C from './config';

const isWild = (s: string) => s === C.WILD;

/**
 * Lucky Sevens. The gamble is offered after a win but is NOT auto-played by the
 * math layer — that's a player decision made in the UI. So `spin()` resolves the
 * base game only; the gamble is exposed as a separate pure helper the UI calls
 * when the player chooses to risk a win. This keeps `spin()` deterministic and
 * keeps the simulator measuring base-game RTP (the gamble is RTP-neutral by
 * design, so it doesn't distort the headline figure).
 */
export const luckySevens: Game = {
  meta: C.META,
  layout: { cols: C.COLS, rows: C.ROWS },
  preview(rng: Rng): Board {
    return fillBoard(rng, C.COLS, C.ROWS, C.WEIGHTS);
  },
  spin(rng: Rng, _options: SpinOptions = {}): Book {
    const events: BookEvent[] = [];
    const symbolWins: SymbolContribution = {};

    const board = fillBoard(rng, C.COLS, C.ROWS, C.WEIGHTS);
    events.push({ type: 'reveal', board });

    const parts = evaluateLines(board, C.LINES, C.PAYTABLE, isWild);
    let total = 0;
    for (const p of parts) {
      total += p.win;
      symbolWins[p.symbol] = (symbolWins[p.symbol] ?? 0) + p.win;
    }
    if (parts.length > 0) events.push({ type: 'wins', parts, stepWin: total });

    if (total > C.MAX_WIN) total = C.MAX_WIN;
    events.push({ type: 'finalWin', totalWin: total });

    return {
      events,
      totalWin: total,
      bonusTriggered: false,
      bonusBuy: false,
      peakMultiplier: 1,
      symbolWins
    };
  }
};

/**
 * Resolve one gamble step. Returns the new stake (doubled on win, 0 on loss).
 * Pure and seedable so it can also be simulated for fairness checks.
 */
export function gambleStep(rng: Rng, stake: number): { won: boolean; stake: number } {
  const won = rng.next() < C.GAMBLE_WIN_CHANCE;
  return { won, stake: won ? stake * 2 : 0 };
}
