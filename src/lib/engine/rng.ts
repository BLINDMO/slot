/**
 * Seedable RNG. We use a small, fast, deterministic generator (mulberry32) so
 * that the Monte Carlo simulator can reproduce exact spin sequences from a seed,
 * and so that a recorded book can be replayed bit-for-bit if needed.
 *
 * This is NOT cryptographically secure — it doesn't need to be. There is no
 * real-money wagering and no server; this is a single-player virtual-currency
 * toy. For production RGS play you would source randomness from a certified RNG.
 */
export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  /** Pick a random element. */
  pick<T>(arr: readonly T[]): T;
  /**
   * Weighted pick: `weights[i]` is the relative weight of `items[i]`.
   * Weights need not sum to 1.
   */
  weighted<T>(items: readonly T[], weights: readonly number[]): T;
}

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (n: number) => Math.floor(next() * n),
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(next() * arr.length)];
    },
    weighted<T>(items: readonly T[], weights: readonly number[]): T {
      let total = 0;
      for (let i = 0; i < weights.length; i++) total += weights[i];
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    }
  };
}

/** Seed from current time + entropy, for real play (non-reproducible). */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
