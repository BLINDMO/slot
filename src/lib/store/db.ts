import { get, set } from 'idb-keyval';
import type { SymbolContribution } from '$engine/types';

/**
 * On-device persistence (IndexedDB via idb-keyval). Everything here is local to
 * the one player on this device — there is no backend, no accounts, no sync.
 */

export const STARTING_BALANCE = 10000;

/** One resolved spin, as logged for the admin dashboard (Section 6). */
export interface SpinRecord {
  timestamp: number;
  gameId: string;
  betAmount: number;
  totalWin: number;
  winMultiplier: number;
  isBonusTriggered: boolean;
  isBonusBuy: boolean;
  symbolsLanded: SymbolContribution;
}

const WIN_BUCKETS = [0, 0.0001, 1, 2, 5, 10, 20, 50, 100, 500, 1000, Infinity];
export function bucketIndex(mult: number): number {
  for (let i = 0; i < WIN_BUCKETS.length - 1; i++)
    if (mult >= WIN_BUCKETS[i] && mult < WIN_BUCKETS[i + 1]) return i;
  return WIN_BUCKETS.length - 2;
}
export function bucketLabels(): string[] {
  const labels: string[] = [];
  for (let i = 0; i < WIN_BUCKETS.length - 1; i++) {
    const lo = WIN_BUCKETS[i];
    const hi = WIN_BUCKETS[i + 1];
    if (i === 0) labels.push('0 (loss)');
    else if (hi === Infinity) labels.push(`${lo}x+`);
    else labels.push(`${lo}–${hi}x`);
  }
  return labels;
}

/** A leaderboard entry. */
export interface BigWin {
  gameId: string;
  multiplier: number;
  amount: number;
  timestamp: number;
}

/** Running aggregates per game (never capped — the source of truth for stats). */
export interface GameAgg {
  spins: number;
  wagered: number;
  paid: number;
  hits: number;
  bonusNatural: number;
  bonusBuy: number;
  /** Win-size distribution by multiplier bucket. */
  buckets: number[];
  /** Per-symbol cumulative payout. */
  symbolWins: SymbolContribution;
}

export interface Aggregates {
  perGame: Record<string, GameAgg>;
  bigWins: BigWin[]; // top N across all games, by multiplier
  sessions: number;
}

export interface Settings {
  soundOn: boolean;
  adminPin: string | null;
  installPromptSeen: boolean;
}

const KEY_BALANCE = 'balance';
const KEY_SETTINGS = 'settings';
const KEY_SPINS = 'spins'; // capped detailed log
const KEY_AGG = 'agg';

const SPIN_LOG_CAP = 5000; // keep full detail for the most recent N spins
const LEADERBOARD_CAP = 50;

function emptyAgg(): GameAgg {
  return {
    spins: 0,
    wagered: 0,
    paid: 0,
    hits: 0,
    bonusNatural: 0,
    bonusBuy: 0,
    buckets: new Array(WIN_BUCKETS.length - 1).fill(0),
    symbolWins: {}
  };
}

export async function loadBalance(): Promise<number> {
  const b = await get<number>(KEY_BALANCE);
  return b ?? STARTING_BALANCE;
}
export async function saveBalance(b: number): Promise<void> {
  await set(KEY_BALANCE, Math.max(0, Math.round(b * 100) / 100));
}

export async function loadSettings(): Promise<Settings> {
  const s = await get<Settings>(KEY_SETTINGS);
  return s ?? { soundOn: true, adminPin: null, installPromptSeen: false };
}
export async function saveSettings(s: Settings): Promise<void> {
  await set(KEY_SETTINGS, s);
}

export async function loadSpins(): Promise<SpinRecord[]> {
  return (await get<SpinRecord[]>(KEY_SPINS)) ?? [];
}

export async function loadAggregates(): Promise<Aggregates> {
  return (await get<Aggregates>(KEY_AGG)) ?? { perGame: {}, bigWins: [], sessions: 0 };
}

export async function bumpSessions(): Promise<void> {
  const agg = await loadAggregates();
  agg.sessions += 1;
  await set(KEY_AGG, agg);
}

/**
 * Record a resolved spin: append to the capped detail log AND fold it into the
 * never-capped aggregates (so dashboard totals survive log rotation, exactly the
 * "roll older spins into aggregates" requirement in Section 6).
 */
export async function recordSpin(rec: SpinRecord): Promise<void> {
  const [spins, agg] = await Promise.all([loadSpins(), loadAggregates()]);

  spins.push(rec);
  if (spins.length > SPIN_LOG_CAP) spins.splice(0, spins.length - SPIN_LOG_CAP);

  const g = (agg.perGame[rec.gameId] ??= emptyAgg());
  g.spins += 1;
  g.wagered += rec.betAmount;
  g.paid += rec.totalWin;
  if (rec.totalWin > 0) g.hits += 1;
  if (rec.isBonusBuy) g.bonusBuy += 1;
  else if (rec.isBonusTriggered) g.bonusNatural += 1;
  g.buckets[bucketIndex(rec.winMultiplier)] += 1;
  for (const [sym, amt] of Object.entries(rec.symbolsLanded))
    g.symbolWins[sym] = (g.symbolWins[sym] ?? 0) + amt;

  if (rec.winMultiplier > 0) {
    agg.bigWins.push({
      gameId: rec.gameId,
      multiplier: rec.winMultiplier,
      amount: rec.totalWin,
      timestamp: rec.timestamp
    });
    agg.bigWins.sort((a, b) => b.multiplier - a.multiplier);
    if (agg.bigWins.length > LEADERBOARD_CAP) agg.bigWins.length = LEADERBOARD_CAP;
  }

  await Promise.all([set(KEY_SPINS, spins), set(KEY_AGG, agg)]);
}

export async function resetAll(): Promise<void> {
  await Promise.all([
    set(KEY_BALANCE, STARTING_BALANCE),
    set(KEY_SPINS, []),
    set(KEY_AGG, { perGame: {}, bigWins: [], sessions: 0 } as Aggregates)
  ]);
}
