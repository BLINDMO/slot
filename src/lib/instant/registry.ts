import type { GameMeta } from '$engine/types';

/**
 * Instant games are a separate category from the slots: tight 1% house edge
 * (99% RTP) vs the slots' 96–97%, and bespoke UIs rather than the book-event
 * board. They share the hub, balance/bet, and telemetry, so they expose a
 * GameMeta for listing and the admin dashboard.
 */
export const PLINKO_META: GameMeta = {
  id: 'plinko',
  category: 'instant',
  title: 'Plinko',
  theme: 'Neon instant game',
  mechanic: 'Drop a ball down the pegs; selectable rows and Low/Med/High risk',
  volatility: 'High',
  targetRtp: 0.99,
  targetHitFreq: 1, // every drop pays a multiplier (often < 1×)
  maxWin: 1000,
  bonusBuyCost: null,
  color: '#19c3c9',
  playable: true
};

export const KENO_META: GameMeta = {
  id: 'keno',
  category: 'instant',
  title: 'Keno',
  theme: 'Neon instant game',
  mechanic: 'Pick up to 10 of 40; 10 are drawn. Classic/Low/Med/High risk',
  volatility: 'High',
  targetRtp: 0.99,
  targetHitFreq: 0.7,
  maxWin: 1000,
  bonusBuyCost: null,
  color: '#b06bff',
  playable: true
};

export const INSTANT_GAMES: GameMeta[] = [PLINKO_META, KENO_META];

export function getInstantMeta(id: string): GameMeta | undefined {
  return INSTANT_GAMES.find((m) => m.id === id);
}
