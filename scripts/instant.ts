/**
 * Exact RTP validation for the instant games. Because both distributions are
 * known in closed form, RTP is an exact expected value — no Monte Carlo needed.
 * Run: npm run sim:instant
 */
import { MIN_ROWS, MAX_ROWS, RISKS, plinkoRtp, plinkoMultipliers } from '../src/lib/instant/plinko';
import { KRISKS, MAX_PICKS, kenoRtp } from '../src/lib/instant/keno';

const LO = 0.985;
const HI = 0.995;
let failures = 0;

const pct = (x: number) => `${(x * 100).toFixed(2)}%`;

console.log('\nPlinko RTP (target 99.00%, band 98.5–99.5%)\n');
for (const risk of RISKS) {
  const cells: string[] = [];
  for (let rows = MIN_ROWS; rows <= MAX_ROWS; rows++) {
    const rtp = plinkoRtp(rows, risk);
    const ok = rtp >= LO && rtp <= HI;
    if (!ok) failures++;
    cells.push(`${rows}:${pct(rtp)}${ok ? '' : '✗'}`);
  }
  console.log(`  ${risk.padEnd(7)} ${cells.join('  ')}`);
}
console.log(
  `\n  e.g. 16-row high edge multiplier: ${plinkoMultipliers(16, 'high')[0]}x  (1000x anchor)`
);

console.log('\nKeno RTP (target 99.00%, band 98.5–99.5%)\n');
for (const risk of KRISKS) {
  const cells: string[] = [];
  for (let picks = 1; picks <= MAX_PICKS; picks++) {
    const rtp = kenoRtp(picks, risk);
    const ok = rtp >= LO && rtp <= HI;
    if (!ok) failures++;
    cells.push(`${picks}:${pct(rtp)}${ok ? '' : '✗'}`);
  }
  console.log(`  ${risk.padEnd(8)} ${cells.join('  ')}`);
}

if (failures > 0) {
  console.error(`\n✗ ${failures} table(s) out of the 98.5–99.5% band.\n`);
  process.exit(1);
}
console.log('\n✓ All Plinko & Keno tables within the 98.5–99.5% RTP band.\n');
