<script lang="ts">
  import { balance, bet, BET_STEPS } from '$store/state';
  import { recordSpin } from '$store/db';
  import { mulberry32, randomSeed } from '$engine/rng';
  import { POOL, KRISKS, type KRisk, kenoPaytable, playKeno } from './keno';
  import { sfx } from '$lib/audio';

  const rng = mulberry32(randomSeed());
  const fmt = (n: number) => Math.round(n).toLocaleString();
  const tiles = Array.from({ length: POOL }, (_, i) => i + 1);

  let selected = $state<number[]>([]);
  let risk = $state<KRisk>('classic');
  let busy = $state(false);
  let revealed = $state<Set<number>>(new Set());
  let liveMatches = $state(0);
  let resultRow = $state<number | null>(null);
  let banner = $state<string | null>(null);
  let flash = $state<string | null>(null);

  const paytable = $derived(kenoPaytable(Math.max(1, selected.length), risk));
  const payEntries = $derived(
    paytable.map((m, matches) => ({ matches, m })).filter((e) => e.m > 0 || e.matches === selected.length)
  );

  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  function toggle(n: number) {
    if (busy) return;
    if (selected.includes(n)) selected = selected.filter((x) => x !== n);
    else if (selected.length < 10) selected = [...selected, n];
    else {
      flash = 'Max 10 picks';
      setTimeout(() => (flash = null), 900);
    }
  }
  function autoPick() {
    if (busy) return;
    const pool = [...tiles];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = rng.int(i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    selected = pool.slice(0, 10).sort((a, b) => a - b);
  }
  function clearPicks() {
    if (busy) return;
    selected = [];
    revealed = new Set();
    liveMatches = 0;
    resultRow = null;
  }

  async function play() {
    if (busy || selected.length === 0) return;
    if ($balance < $bet) {
      flash = 'Not enough credits';
      setTimeout(() => (flash = null), 1100);
      return;
    }
    busy = true;
    revealed = new Set();
    liveMatches = 0;
    resultRow = null;
    banner = null;
    balance.update((b) => b - $bet);
    sfx.unlock();
    sfx.spin();

    const res = playKeno(rng, selected, risk);
    const sel = new Set(selected);

    for (const n of res.drawn) {
      revealed = new Set(revealed).add(n);
      if (sel.has(n)) {
        liveMatches += 1;
        sfx.win(liveMatches);
      } else {
        sfx.reelStop();
      }
      await wait(130);
    }

    const payout = $bet * res.multiplier;
    if (payout > 0) balance.update((b) => b + payout);
    resultRow = res.matchCount;

    if (res.multiplier >= 10) {
      sfx.bigWin();
      banner = `${res.multiplier}× · ${fmt(payout)}`;
    } else if (payout > 0) {
      banner = `+${fmt(payout)}`;
    }
    if (banner) setTimeout(() => (banner = null), 1600);

    void recordSpin({
      timestamp: Date.now(),
      gameId: 'keno',
      betAmount: $bet,
      totalWin: payout,
      winMultiplier: res.multiplier,
      isBonusTriggered: false,
      isBonusBuy: false,
      symbolsLanded: {}
    });

    busy = false;
  }

  function tileState(n: number): string {
    const picked = selected.includes(n);
    const drawn = revealed.has(n);
    if (drawn && picked) return 'hit';
    if (drawn) return 'miss';
    if (picked) return 'pick';
    return '';
  }

  function changeBet(dir: number) {
    if (busy) return;
    const i = BET_STEPS.indexOf($bet);
    bet.set(BET_STEPS[Math.max(0, Math.min(BET_STEPS.length - 1, i + dir))]);
  }
</script>

<div class="board">
  {#if banner}<div class="banner">{banner}</div>{/if}
  {#if flash}<div class="flash">{flash}</div>{/if}

  <div class="grid">
    {#each tiles as n}
      <button class="tile {tileState(n)}" onclick={() => toggle(n)} disabled={busy}>
        {#if tileState(n) === 'hit'}◆{:else}{n}{/if}
      </button>
    {/each}
  </div>

  <div class="counter">
    <span class="muted">{selected.length} / 10 selected</span>
    {#if busy || resultRow !== null}
      <span class="live">{liveMatches} match{liveMatches === 1 ? '' : 'es'}</span>
    {/if}
  </div>

  <div class="paystrip">
    {#each payEntries as e}
      <div class="pay" class:on={resultRow === e.matches}>
        <span class="pm">{e.matches}★</span>
        <span class="px">{e.m > 0 ? `${e.m}×` : '—'}</span>
      </div>
    {/each}
  </div>
</div>

<section class="panel">
  <div class="rowctrl">
    <div class="seg">
      {#each KRISKS as r}
        <button class:on={risk === r} onclick={() => !busy && (risk = r)}>{r}</button>
      {/each}
    </div>
  </div>
  <div class="actions">
    <button class="btn btn-ghost" onclick={autoPick} disabled={busy}>Auto</button>
    <button class="btn btn-ghost" onclick={clearPicks} disabled={busy}>Clear</button>
  </div>
  <div class="controls">
    <div class="betbox">
      <span class="muted">BET</span>
      <div class="betrow">
        <button class="icon-btn sm" onclick={() => changeBet(-1)} disabled={busy}>−</button>
        <strong class="tabular">{$bet}</strong>
        <button class="icon-btn sm" onclick={() => changeBet(1)} disabled={busy}>+</button>
      </div>
    </div>
    <button class="btn btn-primary play" onclick={play} disabled={busy || selected.length === 0}>
      {busy ? '···' : 'PLAY'}
    </button>
  </div>
</section>

<style>
  .board {
    flex: 1;
    min-height: 0;
    position: relative;
    padding: 0.8rem 0.9rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.9rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.45rem;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
  }
  .tile {
    aspect-ratio: 1;
    border-radius: 10px;
    background: linear-gradient(180deg, #1c2336, #141a27);
    border: 1px solid var(--line);
    color: var(--text);
    font-weight: 700;
    font-size: 0.9rem;
    transition: transform 0.06s ease, box-shadow 0.15s ease, background 0.15s ease;
  }
  .tile:active {
    transform: scale(0.92);
  }
  .tile.pick {
    background: linear-gradient(180deg, #2bd4da, #138e93);
    border-color: #2bd4da;
    color: #04210f;
    box-shadow: 0 0 14px rgba(43, 212, 218, 0.5);
  }
  .tile.hit {
    background: linear-gradient(180deg, #44e08a, #1f9457);
    border-color: #6dffb0;
    color: #04210f;
    box-shadow: 0 0 16px rgba(68, 224, 138, 0.7);
    animation: hit 0.3s ease;
  }
  .tile.miss {
    background: #0e1320;
    border-color: var(--line-soft);
    color: var(--muted);
    opacity: 0.5;
    font-size: 0.7rem;
  }
  @keyframes hit {
    from {
      transform: scale(1.3);
    }
  }
  .counter {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    font-size: 0.78rem;
  }
  .live {
    color: var(--good);
    font-weight: 700;
  }
  .paystrip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .pay {
    flex: 1 0 auto;
    min-width: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 0.25rem 0.3rem;
  }
  .pay.on {
    border-color: var(--good);
    background: rgba(51, 201, 119, 0.16);
  }
  .pm {
    font-size: 0.6rem;
    color: var(--muted);
  }
  .px {
    font-size: 0.78rem;
    font-weight: 700;
  }
  .banner {
    position: absolute;
    top: 30%;
    left: 0;
    right: 0;
    text-align: center;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.8rem;
    color: #b06bff;
    text-shadow: 0 0 22px rgba(176, 107, 255, 0.7);
    pointer-events: none;
    z-index: 5;
    animation: pop 0.3s ease;
  }
  .flash {
    position: absolute;
    top: 40%;
    left: 0;
    right: 0;
    text-align: center;
    font-weight: 700;
    color: var(--gold);
    pointer-events: none;
    z-index: 5;
  }
  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }

  .panel {
    background: var(--panel-grad);
    border-top: 1px solid var(--line);
    padding: 0.7rem 0.9rem calc(0.9rem + env(safe-area-inset-bottom));
  }
  .rowctrl {
    margin-bottom: 0.6rem;
  }
  .seg {
    display: flex;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 2px;
  }
  .seg button {
    flex: 1;
    text-transform: capitalize;
    font-size: 0.76rem;
    font-weight: 600;
    padding: 0.35rem 0.4rem;
    border-radius: 999px;
    color: var(--muted);
  }
  .seg button.on {
    background: linear-gradient(180deg, #c08bff, #8a4fd0);
    color: #160a26;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.6rem;
  }
  .actions .btn {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.85rem;
  }
  .controls {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.7rem;
  }
  .betbox {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 0.4rem 0.6rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }
  .betbox > span {
    font-size: 0.55rem;
    letter-spacing: 1px;
  }
  .betrow {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .betrow strong {
    font-size: 1.1rem;
    min-width: 34px;
    text-align: center;
  }
  .icon-btn.sm {
    width: 30px;
    height: 30px;
    font-size: 1rem;
  }
  .play {
    font-family: var(--font-display);
    font-size: 1.3rem;
    letter-spacing: 2px;
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 18px rgba(47, 191, 113, 0.4);
  }
</style>
