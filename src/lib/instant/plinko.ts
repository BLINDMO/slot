import type { Rng } from '$engine/rng';
import { choose } from './combinatorics';

export type Risk = 'low' | 'medium' | 'high';
export const RISKS: Risk[] = ['low', 'medium', 'high'];
export const MIN_ROWS = 8;
export const MAX_ROWS = 16;
const TARGET_RTP = 0.99;

/** P(ball lands in slot k) = C(rows,k)/2^rows — a binomial random walk. */
export function binomProb(rows: number, k: number): number {
  return choose(rows, k) / 2 ** rows;
}

/**
 * Verified anchor tables (from the blueprint, each ≈99% RTP). Stored as the full
 * symmetric slot array (length rows+1). Row counts between these are derived.
 */
const ANCHORS: Record<number, Record<Risk, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

// Shape parameters for derived rows, anchored to the 8↔16 edge multipliers.
const EDGE: Record<Risk, [number, number]> = { low: [5.6, 16], medium: [13, 110], high: [29, 1000] };
const CENTER: Record<Risk, number> = { low: 0.5, medium: 0.35, high: 0.2 };
const GAMMA: Record<Risk, number> = { low: 1.8, medium: 2.5, high: 3.4 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function roundMult(v: number): number {
  if (v >= 100) return Math.round(v);
  if (v >= 10) return Math.round(v * 10) / 10;
  return Math.round(v * 100) / 100;
}

/**
 * Derive a symmetric multiplier curve for an in-between row count: geometric
 * interpolation of the edge multiplier between the 8- and 16-row anchors, an
 * exponential decay from edge to center, then a uniform scale so the expected
 * value is exactly 99% (RTP is linear in the multipliers).
 */
function generate(rows: number, risk: Risk): number[] {
  const t = (rows - 8) / 8;
  const [e8, e16] = EDGE[risk];
  const edge = Math.exp(lerp(Math.log(e8), Math.log(e16), t));
  const center = CENTER[risk];
  const mid = rows / 2;

  const raw: number[] = [];
  for (let k = 0; k <= rows; k++) {
    const d = Math.abs(k - mid) / mid; // 0 at center, 1 at the edge
    raw.push(center * (edge / center) ** d ** GAMMA[risk]);
  }
  let rtp = 0;
  for (let k = 0; k <= rows; k++) rtp += binomProb(rows, k) * raw[k];
  const scale = TARGET_RTP / rtp;
  return raw.map((x) => roundMult(x * scale));
}

const cache = new Map<string, number[]>();

/** Multiplier per slot (length rows+1) for the given board height and risk. */
export function plinkoMultipliers(rows: number, risk: Risk): number[] {
  const key = `${rows}:${risk}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const table = ANCHORS[rows]?.[risk] ?? generate(rows, risk);
  cache.set(key, table);
  return table;
}

/** Exact expected return (RTP) of a board/risk combo. */
export function plinkoRtp(rows: number, risk: Risk): number {
  const m = plinkoMultipliers(rows, risk);
  let s = 0;
  for (let k = 0; k <= rows; k++) s += binomProb(rows, k) * m[k];
  return s;
}

export interface PlinkoResult {
  /** Lane index after each row, lane[r] in 0..r (lane[0] === 0). Drives the ball animation. */
  lane: number[];
  /** Final slot (0..rows). */
  slot: number;
  multiplier: number;
}

/** Drop one ball: an independent 50/50 bounce at each of `rows` pegs. */
export function dropBall(rng: Rng, rows: number, risk: Risk): PlinkoResult {
  const lane = [0];
  let slot = 0;
  for (let r = 0; r < rows; r++) {
    if (rng.next() < 0.5) slot += 1; // bounce right
    lane.push(slot);
  }
  return { lane, slot, multiplier: plinkoMultipliers(rows, risk)[slot] };
}
