/**
 * Headless screenshot + playthrough harness. Not part of the app build — a dev
 * tool to review the UI and catch runtime errors without a real device.
 *
 *   node scripts/shots.mjs            # screenshot every screen
 *   node scripts/shots.mjs play       # + drive spins/drops and capture errors
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:5173';
const OUT = 'shots';
const doPlay = process.argv.includes('play');

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
});

const errors = [];
ctx.on('weberror', (e) => errors.push(`weberror: ${e.error().message}`));

const page = await ctx.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

async function go(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(600);
}
async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  shot: ${OUT}/${name}.png`);
}

console.log('\nCapturing screens…');
await go('/');
await shot('01-hub');

await go('/play/blackwaterBay');
await shot('02-blackwater');

await go('/play/highNoon');
await shot('03-highnoon');

await go('/play/luckySevens');
await shot('04-luckysevens');

await go('/instant/plinko');
await shot('05-plinko');

await go('/instant/keno');
await shot('06-keno');

await go('/admin');
await shot('07-admin-gate');

if (doPlay) {
  console.log('\nPlaythrough…');

  // --- Blackwater Bay: spin a few times ---
  await go('/play/blackwaterBay');
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'SPIN' }).click();
    await page.waitForTimeout(2500);
  }
  await shot('play-blackwater');

  // --- Plinko: drop several balls ---
  await go('/instant/plinko');
  const drop = page.getByRole('button', { name: 'DROP' });
  for (let i = 0; i < 6; i++) {
    await drop.click();
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(2500);
  await shot('play-plinko');

  // --- Keno: auto-pick then play ---
  await go('/instant/keno');
  await page.getByRole('button', { name: 'Auto' }).click();
  await page.waitForTimeout(300);
  await shot('play-keno-picked');
  await page.getByRole('button', { name: 'PLAY' }).click();
  await page.waitForTimeout(2500);
  await shot('play-keno-result');

  // --- Game-switch stress: open each game in sequence twice (crash check) ---
  console.log('  switch-stress…');
  for (let round = 0; round < 2; round++) {
    for (const path of ['/play/blackwaterBay', '/play/highNoon', '/play/luckySevens', '/instant/plinko', '/instant/keno', '/']) {
      await go(path);
    }
  }
  await shot('after-switch-stress');
}

console.log(`\nErrors captured: ${errors.length}`);
for (const e of errors.slice(0, 40)) console.log('  ✗ ' + e);

await browser.close();
process.exit(0);
