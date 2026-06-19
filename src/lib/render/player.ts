import type { Book } from '$engine/types';
import type { SlotRenderer } from './SlotRenderer';
import { sfx } from '../audio';

/** UI hooks the player updates as the book plays back. */
export interface PlayerCallbacks {
  /** Running win for this round, in credits (already scaled by bet). */
  onWin: (credits: number) => void;
  onMultiplier: (value: number) => void;
  onFreeSpins: (remaining: number, total: number) => void;
  onBonusIntro: () => void;
  onMessage: (msg: string | null) => void;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Replay a book against the renderer. The book is authoritative — this function
 * decides nothing, it only animates what already happened. `bet` scales
 * bet-multiple wins into credits for display.
 */
export async function playBook(
  renderer: SlotRenderer,
  book: Book,
  bet: number,
  cb: PlayerCallbacks,
  soundOn: boolean
): Promise<void> {
  let runningWin = 0;
  let mult = 1;
  cb.onMultiplier(1);
  cb.onMessage(null);

  for (const ev of book.events) {
    switch (ev.type) {
      case 'reveal':
        await renderer.renderBoard(ev.board, true);
        if (soundOn) sfx.reelStop();
        break;

      case 'wins': {
        const cells = ev.parts.flatMap((p) => p.cells);
        if (soundOn) sfx.win(ev.stepWin);
        await renderer.highlight(cells);
        runningWin += ev.stepWin * bet;
        cb.onWin(runningWin);
        break;
      }

      case 'tumble':
        await renderer.clearCells(ev.cleared);
        await renderer.renderBoard(ev.board, true);
        break;

      case 'globalMultiplier':
        mult = ev.value;
        cb.onMultiplier(mult);
        break;

      case 'scatter':
        if (soundOn) sfx.bonus();
        await renderer.winFlash(true);
        break;

      case 'freeSpinsAwarded':
        cb.onMessage(`+${ev.count} Free Spins!`);
        await wait(700);
        cb.onMessage(null);
        break;

      case 'freeSpinsStart':
        cb.onBonusIntro();
        cb.onFreeSpins(ev.count, ev.count);
        await wait(500);
        break;

      case 'freeSpinIndex':
        cb.onFreeSpins(ev.total - ev.index + 1, ev.total);
        break;

      case 'freeSpinsEnd':
        cb.onFreeSpins(0, 0);
        break;

      case 'feature':
        if (ev.name === 'bonusBuy') cb.onBonusIntro();
        break;

      case 'finalWin': {
        const credits = ev.totalWin * bet;
        cb.onWin(credits);
        if (credits > 0) await renderer.winFlash(ev.totalWin >= 20);
        if (ev.totalWin >= 20 && soundOn) sfx.bigWin();
        break;
      }
    }
  }
}
