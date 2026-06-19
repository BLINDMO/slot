/**
 * Offline Monte Carlo RTP validator. Run before shipping any game's config:
 *
 *   npm run sim blackwaterBay 5000000
 *   npm run sim luckySevens 2000000
 *   npm run sim blackwaterBay 1000000 --buy   # measure bonus-buy RTP
 *
 * Exits non-zero if the measured RTP drifts more than the allowed tolerance from
 * the game's declared target, so this can gate CI.
 */
import { simulate } from '../src/lib/sim/simulate';
import { getGame } from '../src/lib/games/index';

const [, , gameId = 'blackwaterBay', spinsArg = '2000000', ...rest] = process.argv;
const spins = Number(spinsArg);
const bonusBuy = rest.includes('--buy');
const tolerance = 0.01; // ±1.0 percentage point

const game = getGame(gameId);
if (!game) {
  console.error(`Unknown game "${gameId}". Known: see src/lib/games/index.ts`);
  process.exit(2);
}
if (!game.meta.playable) {
  console.error(`"${gameId}" has no math implemented yet (coming soon).`);
  process.exit(2);
}

console.log(`\nSimulating ${spins.toLocaleString()} spins of ${game.meta.title}${bonusBuy ? ' (bonus buy)' : ''}…`);
const t0 = Date.now();
const r = simulate(game, spins, 0x1234abcd, { bonusBuy });
const secs = ((Date.now() - t0) / 1000).toFixed(1);

const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
console.log(`\n  done in ${secs}s (${Math.round(spins / Number(secs)).toLocaleString()} spins/s)\n`);
console.log(`  RTP             ${pct(r.rtp)}   (target ${pct(game.meta.targetRtp)})`);
console.log(`  Hit frequency   ${pct(r.hitFrequency)}   (target ${pct(game.meta.targetHitFreq)})`);
console.log(`  Bonus frequency ${pct(r.bonusFrequency)}   (~1 in ${r.bonusFrequency ? Math.round(1 / r.bonusFrequency).toLocaleString() : '∞'})`);
console.log(`  Max win         ${r.maxWin.toFixed(0)}x   (cap ${game.meta.maxWin}x)`);
console.log(`  Volatility (σ)  ${r.volatility.toFixed(2)}`);

console.log(`\n  Win-size distribution:`);
for (const b of r.buckets) {
  const share = b.count / r.spins;
  const bar = '█'.repeat(Math.round(share * 50));
  console.log(`    ${b.label.padEnd(10)} ${pct(share).padStart(7)} ${bar}`);
}

console.log(`\n  Top symbol contributions (share of total payout):`);
const totalPaid = Object.values(r.symbolWins).reduce((a, b) => a + b, 0) || 1;
const sorted = Object.entries(r.symbolWins).sort((a, b) => b[1] - a[1]);
for (const [sym, amt] of sorted.slice(0, 8))
  console.log(`    ${sym.padEnd(8)} ${pct(amt / totalPaid).padStart(7)}`);

// Gate: only enforce on the natural game (bonus-buy RTP differs by design).
if (!bonusBuy) {
  const drift = Math.abs(r.rtp - game.meta.targetRtp);
  if (drift > tolerance) {
    console.error(`\n  ✗ RTP drift ${pct(drift)} exceeds tolerance ${pct(tolerance)} — tune the config.\n`);
    process.exit(1);
  }
  console.log(`\n  ✓ RTP within ${pct(tolerance)} of target.\n`);
}
