<script lang="ts">
  import { balance, bet } from '$store/state';
  import { recordSpin } from '$store/db';
  import BetControl from '$lib/components/BetControl.svelte';
  import GameShell from '$lib/components/GameShell.svelte';
  import GameHeader from '$lib/components/GameHeader.svelte';
  import WinPopup from '$lib/components/WinPopup.svelte';
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
  let winPopup = $state<{ amount: number; label: string; accent: string } | null>(null);

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
    winPopup = null;
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

    if (res.multiplier >= 5) {
      sfx.bigWin();
      const label = res.multiplier >= 100 ? 'MEGA WIN' : res.multiplier >= 20 ? 'BIG WIN' : 'NICE WIN';
      const accent = res.multiplier >= 100 ? '#f1c232' : res.multiplier >= 20 ? '#19c3c9' : '#1fd35b';
      winPopup = { amount: payout, label, accent };
    } else if (payout > 0) {
      banner = `+${fmt(payout)}`;
      setTimeout(() => (banner = null), 1600);
    }

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

</script>

<GameShell>
  {#snippet header()}
    <GameHeader title="Keno" />
  {/snippet}

  {#snippet canvas()}
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
    </div>
  {/snippet}

  {#snippet controls()}
    <section class="panel">
      <div class="paystrip">
        {#each payEntries as e}
          <div class="pay" class:on={resultRow === e.matches}>
            <span class="pm">{e.matches}★</span>
            <span class="px">{e.m > 0 ? `${e.m}×` : '—'}</span>
          </div>
        {/each}
      </div>
      <div class="rowctrl">
        <span class="lbl">Risk</span>
        <div class="segment">
          {#each KRISKS as r}
            <button class:on={risk === r} onclick={() => !busy && (risk = r)}>{r}</button>
          {/each}
        </div>
      </div>
      <div class="actions">
        <button class="btn" onclick={autoPick} disabled={busy}>Auto Pick</button>
        <button class="btn" onclick={clearPicks} disabled={busy}>Clear</button>
      </div>
      <div class="controls">
        <BetControl disabled={busy} />
        <button class="btn btn-primary play" onclick={play} disabled={busy || selected.length === 0}>
          {busy ? '···' : 'PLAY'}
        </button>
      </div>
    </section>
  {/snippet}
</GameShell>

{#if winPopup}
  <WinPopup amount={winPopup.amount} label={winPopup.label} accent={winPopup.accent} onClose={() => (winPopup = null)} />
{/if}

<style>
  .board {
    position: absolute;
    inset: 0;
    padding: 0.7rem 0.8rem 0.4rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
    overflow: hidden;
    background: radial-gradient(120% 55% at 50% 8%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%);
  }
  /* 5×8 portrait grid fills a tall phone with large, readable tiles. */
  .grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.45rem;
    width: 100%;
  }
  .tile {
    aspect-ratio: 1;
    border-radius: 12px;
    background: linear-gradient(180deg, #1c2336, #141a27);
    border: 1px solid var(--line);
    color: var(--text);
    font-weight: 700;
    font-size: 1.2rem;
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
    margin-bottom: 0.45rem;
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
    flex: none;
    background: var(--panel-grad);
    border-top: 1px solid var(--line);
    padding: 0.55rem 0.7rem;
  }
  .rowctrl {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.45rem;
  }
  .lbl {
    font-size: 0.62rem;
    letter-spacing: 0.4px;
    color: var(--muted);
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.45rem;
  }
  .actions .btn {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.85rem;
  }
  .controls {
    display: grid;
    grid-template-columns: 1fr 42%;
    gap: 0.6rem;
    align-items: end;
  }
  .play {
    min-height: 48px;
    font-family: var(--font-display);
    font-size: 1.15rem;
    letter-spacing: 2px;
  }
</style>
