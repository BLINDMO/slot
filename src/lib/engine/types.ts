/**
 * The engine is split into a MATH layer and a PRESENTATION layer, exactly as the
 * Stake `math-sdk` / `web-sdk` split recommends.
 *
 *  - The math layer (each game's `spin()`) is pure: given an RNG and a bet, it
 *    produces a `Book` — an ordered list of `BookEvent`s describing everything
 *    that happened in the spin. It never touches the DOM, PixiJS, or audio.
 *  - The presentation layer replays a `Book` event-by-event with animation. It
 *    never decides outcomes.
 *
 * Because outcomes are fully determined by the math layer, the same `spin()` can
 * be called millions of times by the Monte Carlo simulator to measure real RTP,
 * and the admin dashboard gets accurate per-spin telemetry for free.
 */

export type SymbolId = string;

/** A board is column-major: board[col][row]. Ragged columns (Megaways) allowed. */
export type Board = SymbolId[][];

/** A cell coordinate on the board. */
export interface Cell {
  col: number;
  row: number;
}

export interface WinPart {
  symbol: SymbolId;
  /** Cells that formed this win. */
  cells: Cell[];
  /** Number of matched symbols (cluster size, or line length). */
  count: number;
  /** Win in bet-multiples, BEFORE any global/position multiplier is applied. */
  baseWin: number;
  /** Win in bet-multiples AFTER multipliers — what actually pays. */
  win: number;
}

/**
 * Every distinct thing the renderer needs to animate is one of these events.
 * Adding a new game's mechanic generally means adding a new event variant here
 * and a handler in the renderer — extension, not rewrite.
 */
export type BookEvent =
  | { type: 'reveal'; board: Board }
  | { type: 'wins'; parts: WinPart[]; stepWin: number }
  | { type: 'tumble'; cleared: Cell[]; board: Board }
  | { type: 'globalMultiplier'; value: number }
  | { type: 'scatter'; cells: Cell[]; count: number }
  | { type: 'freeSpinsAwarded'; count: number }
  | { type: 'freeSpinsStart'; count: number }
  | { type: 'freeSpinIndex'; index: number; total: number }
  | { type: 'freeSpinsEnd' }
  | { type: 'feature'; name: string; data?: Record<string, unknown> }
  | { type: 'finalWin'; totalWin: number };

/** Per-symbol payout contribution, for the admin dashboard. */
export type SymbolContribution = Record<SymbolId, number>;

/** The full machine-readable result of one spin (in bet-multiples). */
export interface Book {
  events: BookEvent[];
  /** Total win in bet-multiples (e.g. 12.5 means 12.5x the bet). */
  totalWin: number;
  bonusTriggered: boolean;
  bonusBuy: boolean;
  /** Highest multiplier reached at any point (for telemetry / "max win" feel). */
  peakMultiplier: number;
  /** Payout broken down by the symbol that produced it. */
  symbolWins: SymbolContribution;
}

export interface SpinOptions {
  /** If set, buy straight into the bonus round at the configured cost. */
  bonusBuy?: boolean;
}

/** Static descriptive metadata about a game, used by the hub and dashboard. */
export interface GameMeta {
  id: string;
  /** Slot games render the book-event board; instant games have bespoke UIs. */
  category?: 'slot' | 'instant';
  title: string;
  theme: string;
  /** One-line description of the signature mechanic. */
  mechanic: string;
  volatility: 'Medium' | 'Medium-High' | 'High' | 'Very High';
  /** Target theoretical RTP, e.g. 0.965. */
  targetRtp: number;
  /** Target hit frequency, e.g. 0.25. */
  targetHitFreq: number;
  /** Max win in bet-multiples. */
  maxWin: number;
  /** Bonus-buy cost in bet-multiples, or null for games without a buy. */
  bonusBuyCost: number | null;
  /** Accent color used in hub chrome. */
  color: string;
  /** Whether the game is fully implemented (vs. a coming-soon placeholder). */
  playable: boolean;
}

/** The contract every slot game implements. */
export interface Game {
  meta: GameMeta;
  /**
   * Run one spin. Pure: same rng state + options => same book. The bet is always
   * normalized to 1.0 here; the UI scales wins by the actual bet afterwards.
   */
  spin(rng: import('./rng').Rng, options?: SpinOptions): Book;
  /** Grid dimensions for the renderer (max rows for ragged/Megaways layouts). */
  layout: { cols: number; rows: number };
  /** A random, non-paying board to show while idle (visual only). */
  preview(rng: import('./rng').Rng): Board;
}
