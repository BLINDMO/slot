import type { Game, GameMeta } from '$engine/types';
import { blackwaterBay } from './blackwaterBay/game';
import { luckySevens } from './luckySevens/game';

/**
 * Placeholder for a game whose math is not yet implemented. It satisfies the
 * `Game` contract (so the hub and dashboard can list it) but refuses to spin.
 */
function comingSoon(meta: Omit<GameMeta, 'playable'>): Game {
  return {
    meta: { ...meta, playable: false },
    layout: { cols: 5, rows: 3 },
    preview() {
      throw new Error(`${meta.title} is not implemented yet`);
    },
    spin() {
      throw new Error(`${meta.title} is not implemented yet`);
    }
  };
}

/** The four games still on the roadmap (Section 4 of the brief). */
const vaultbreakers = comingSoon({
  id: 'vaultbreakers',
  title: 'Vaultbreakers',
  theme: 'Bank-heist / vault',
  mechanic: 'Hold & Win money respins with a 4-tier mini/minor/major/grand jackpot',
  volatility: 'Medium-High',
  targetRtp: 0.962,
  targetHitFreq: 0.35,
  maxWin: 10000,
  bonusBuyCost: 150,
  color: '#c0c4cc'
});

const highNoon = comingSoon({
  id: 'highNoon',
  title: 'High Noon',
  theme: 'Wild west duel',
  mechanic: 'VS duel feature awards an escalating-multiplier sticky wild in free spins',
  volatility: 'High',
  targetRtp: 0.964,
  targetHitFreq: 0.28,
  maxWin: 12500,
  bonusBuyCost: 120,
  color: '#b5651d'
});

const forgeOfValhalla = comingSoon({
  id: 'forgeOfValhalla',
  title: 'Forge of Valhalla',
  theme: 'Norse mythology',
  mechanic: 'Megaways-style dynamic ways; free-spin multiplier upgrades on every hit',
  volatility: 'Very High',
  targetRtp: 0.965,
  targetHitFreq: 0.22,
  maxWin: 20000,
  bonusBuyCost: 150,
  color: '#5b8def'
});

const novaDrift = comingSoon({
  id: 'novaDrift',
  title: 'Nova Drift',
  theme: 'Sci-fi space mining',
  mechanic: 'Pick-and-click mineral-core prize grid; avoid the void tiles',
  volatility: 'Medium-High',
  targetRtp: 0.963,
  targetHitFreq: 0.3,
  maxWin: 8000,
  bonusBuyCost: 110,
  color: '#9b5de5'
});

/** Registry in hub display order. */
export const GAMES: Game[] = [
  blackwaterBay,
  vaultbreakers,
  highNoon,
  forgeOfValhalla,
  luckySevens,
  novaDrift
];

export const GAMES_BY_ID: Record<string, Game> = Object.fromEntries(
  GAMES.map((g) => [g.meta.id, g])
);

export function getGame(id: string): Game | undefined {
  return GAMES_BY_ID[id];
}
