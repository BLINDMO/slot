/**
 * Exact binomial coefficient C(n, k) for the small ranges these instant games
 * need (Plinko: n<=16; Keno: n<=40, and C(40,10) ≈ 8.48e8 which is well within
 * a JS double's exact-integer range of 2^53). The multiplicative form keeps
 * intermediate values small; we round to undo the tiny FP drift so the result is
 * an exact integer.
 */
export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}
