/**
 * Lightweight engine smoke tests (run with `npm test`). Not a full suite — just
 * enough to catch regressions in the core evaluators that the RTP sims rely on.
 */
import { mulberry32 } from '../src/lib/engine/rng';
import { findClusters, tumble } from '../src/lib/engine/board';
import { evaluateLines } from '../src/lib/engine/paylines';
import type { Board } from '../src/lib/engine/types';

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

console.log('\nRNG');
{
  const a = mulberry32(42);
  const b = mulberry32(42);
  assert(a.next() === b.next(), 'same seed yields same sequence');
  const r = mulberry32(1);
  let ok = true;
  for (let i = 0; i < 1000; i++) {
    const v = r.next();
    if (v < 0 || v >= 1) ok = false;
  }
  assert(ok, 'next() stays in [0,1)');
}

console.log('\nClusters');
{
  // 4×4 board with an L-shaped cluster of 'A' plus a bridging wild.
  const board: Board = [
    ['A', 'A', 'B', 'B'],
    ['A', 'W', 'B', 'B'],
    ['A', 'A', 'C', 'C'],
    ['D', 'D', 'C', 'C']
  ];
  const clusters = findClusters(board, (s) => s === 'W', () => true);
  const a = clusters.find((c) => c.symbol === 'A');
  assert(!!a && a.cells.length === 6, 'wild bridges into the A cluster (size 6)');
  const c = clusters.find((c) => c.symbol === 'C');
  assert(!!c && c.cells.length === 4, 'separate C cluster found (size 4)');
}

console.log('\nTumble gravity');
{
  const rng = mulberry32(7);
  const board: Board = [['A', 'B', 'C']]; // col top->bottom
  const next = tumble(rng, board, [{ col: 0, row: 1 }], {
    symbols: ['X'],
    weights: [1]
  });
  assert(next[0][2] === 'C' && next[0][1] === 'A' && next[0][0] === 'X', 'survivors fall, new symbol fills top');
}

console.log('\nPaylines');
{
  const board: Board = [
    ['7', 'L'],
    ['7', 'L'],
    ['7', 'L']
  ];
  const parts = evaluateLines(board, [[0, 0, 0]], { '7': { 3: 100 } }, (s) => s === 'W');
  assert(parts.length === 1 && parts[0].win === 100, 'three-of-a-kind line pays');

  const board2: Board = [
    ['W', 'L'],
    ['7', 'L'],
    ['7', 'L']
  ];
  const parts2 = evaluateLines(board2, [[0, 0, 0]], { '7': { 3: 100 } }, (s) => s === 'W');
  assert(parts2.length === 1 && parts2[0].win === 100, 'wild substitutes on a line');
}

console.log(failed === 0 ? '\nAll engine tests passed.\n' : `\n${failed} test(s) failed.\n`);
process.exit(failed === 0 ? 0 : 1);
