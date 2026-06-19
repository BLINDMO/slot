import type { Rng } from '$engine/rng';
import { choose } from './combinatorics';

export type KRisk = 'classic' | 'low' | 'medium' | 'high';
export const KRISKS: KRisk[] = ['classic', 'low', 'medium', 'high'];
export const POOL = 40;
export const DRAW = 10;
export const MAX_PICKS = 10;
const TARGET_RTP = 0.99;

/**
 * P(exactly m matches | n picks) — hypergeometric: draw 10 of 40 without
 * replacement, having tagged n of the 40 in advance.
 */
export function hyperProb(picks: number, m: number): number {
  return (choose(picks, m) * choose(POOL - picks, DRAW - m)) / choose(POOL, DRAW);
}

/** Verified anchor paytables (index = match count). Other pick counts derived. */
const ANCHORS: Record<number, Record<KRisk, number[]>> = {
  1: {
    classic: [0, 3.96],
    low: [0, 3.96],
    medium: [0, 3.96],
    high: [0, 3.96]
  },
  5: {
    classic: [0, 0.46, 1.33, 3.89, 11.32, 32.98],
    low: [0, 0, 1.28, 5.13, 20.56, 82.46],
    medium: [0, 0, 0.89, 5.08, 28.93, 164.93],
    high: [0, 0, 0, 5.67, 43.24, 329.87]
  },
  10: {
    classic: [0, 0, 0.55, 1.05, 2.01, 3.86, 7.39, 14.18, 27.19, 52.14, 100],
    low: [0, 0, 0, 1.11, 2.41, 5.23, 11.34, 24.56, 53.23, 115.36, 250],
    medium: [0, 0, 0, 0, 3.44, 7.89, 18.1, 41.49, 95.13, 218.09, 500],
    high: [0, 0, 0, 0, 0, 16.2, 36.94, 84.26, 192.2, 438.41, 1000]
  }
};

/**
 * Lowest match count that pays, getting stricter as risk rises. These formulas
 * exactly reproduce the anchor floors (5-pick: C1/L2/M2/H3; 10-pick: C2/L3/M4/H5)
 * and extend sensibly to the in-between pick counts.
 */
function floorFor(picks: number, risk: KRisk): number {
  switch (risk) {
    case 'classic':
      return Math.max(1, Math.floor(picks / 4));
    case 'low':
      return Math.max(1, Math.round(picks / 3));
    case 'medium':
      return Math.max(1, Math.round(picks / 2.5));
    case 'high':
      return Math.max(1, Math.round(picks / 2));
  }
}

const GROWTH: Record<KRisk, number> = { classic: 2.0, low: 2.4, medium: 3.0, high: 3.8 };

function roundMult(v: number): number {
  if (v >= 100) return Math.round(v);
  if (v >= 10) return Math.round(v * 10) / 10;
  return Math.round(v * 100) / 100;
}

/**
 * Derive a paytable: a geometric growth curve above the risk-dependent floor,
 * scaled so the expected value is exactly 99% (RTP is linear in the payouts).
 */
function generate(picks: number, risk: KRisk): number[] {
  const floor = floorFor(picks, risk);
  const g = GROWTH[risk];
  const raw: number[] = [];
  for (let m = 0; m <= picks; m++) raw.push(m < floor ? 0 : g ** (m - floor));
  let rtp = 0;
  for (let m = 0; m <= picks; m++) rtp += hyperProb(picks, m) * raw[m];
  const scale = rtp > 0 ? TARGET_RTP / rtp : 0;
  return raw.map((x) => (x === 0 ? 0 : roundMult(x * scale)));
}

const cache = new Map<string, number[]>();

/** Paytable for a pick count and risk: multiplier indexed by number of matches. */
export function kenoPaytable(picks: number, risk: KRisk): number[] {
  const key = `${picks}:${risk}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const table = ANCHORS[picks]?.[risk] ?? generate(picks, risk);
  cache.set(key, table);
  return table;
}

export function kenoRtp(picks: number, risk: KRisk): number {
  const t = kenoPaytable(picks, risk);
  let s = 0;
  for (let m = 0; m <= picks; m++) s += hyperProb(picks, m) * t[m];
  return s;
}

/** Draw 10 distinct numbers from 1..40 (partial Fisher–Yates). */
export function kenoDraw(rng: Rng): number[] {
  const pool: number[] = [];
  for (let i = 1; i <= POOL; i++) pool.push(i);
  for (let i = 0; i < DRAW; i++) {
    const j = i + rng.int(POOL - i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DRAW).sort((a, b) => a - b);
}

export interface KenoResult {
  drawn: number[];
  matches: number[]; // the player's picks that hit
  matchCount: number;
  multiplier: number;
}

export function playKeno(rng: Rng, picks: number[], risk: KRisk): KenoResult {
  const drawn = kenoDraw(rng);
  const drawnSet = new Set(drawn);
  const matches = picks.filter((p) => drawnSet.has(p));
  const table = kenoPaytable(picks.length, risk);
  return {
    drawn,
    matches,
    matchCount: matches.length,
    multiplier: table[matches.length] ?? 0
  };
}
