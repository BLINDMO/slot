<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { getGame } from '$games/index';
  import { balance, bet, BET_STEPS, settings } from '$store/state';
  import { recordSpin } from '$store/db';
  import { mulberry32, randomSeed } from '$engine/rng';
  import { SlotRenderer } from '$lib/render/SlotRenderer';
  import { playBook } from '$lib/render/player';
  import { sfx } from '$lib/audio';

  const gameId = page.params.gameId ?? '';
  const game = getGame(gameId);

  // One RNG per play session (non-reproducible real play).
  const rng = mulberry32(randomSeed());

  let boardEl = $state<HTMLDivElement>();
  let renderer: SlotRenderer | null = null;

  let busy = $state(false);
  let win = $state(0);
  let multiplier = $state(1);
  let fsRemaining = $state(0);
  let fsTotal = $state(0);
  let message = $state<string | null>(null);
  let inBonus = $state(false);

  const fmt = (n: number) => Math.round(n).toLocaleString();
  const buyCost = $derived(game && game.meta.bonusBuyCost ? game.meta.bonusBuyCost * $bet : 0);

  onMount(async () => {
    if (!game || !game.meta.playable || !boardEl) return;
    renderer = new SlotRenderer(gameId, game.layout.cols, game.layout.rows);
    await renderer.mount(boardEl);
    await renderer.renderBoard(game.preview(rng), false);
  });

  onDestroy(() => renderer?.destroy());

  function changeBet(dir: number) {
    if (busy) return;
    const i = BET_STEPS.indexOf($bet);
    const next = BET_STEPS[Math.max(0, Math.min(BET_STEPS.length - 1, i + dir))];
    bet.set(next);
  }

  async function spin(bonusBuy = false) {
    if (!game || busy) return;
    const cost = bonusBuy ? buyCost : $bet;
    if ($balance < cost) {
      message = 'Not enough credits';
      setTimeout(() => (message = null), 1200);
      return;
    }

    busy = true;
    win = 0;
    multiplier = 1;
    sfx.unlock();
    if ($settings.soundOn) sfx.spin();

    balance.update((b) => b - cost);

    const book = game.spin(rng, { bonusBuy });

    await playBook(renderer!, book, $bet, {
      onWin: (c) => (win = c),
      onMultiplier: (m) => (multiplier = m),
      onFreeSpins: (rem, tot) => {
        fsRemaining = rem;
        fsTotal = tot;
        inBonus = tot > 0;
      },
      onBonusIntro: () => (inBonus = true),
      onMessage: (m) => (message = m)
    }, $settings.soundOn);

    const payout = book.totalWin * $bet;
    if (payout > 0) balance.update((b) => b + payout);

    await recordSpin({
      timestamp: Date.now(),
      gameId,
      betAmount: cost,
      totalWin: payout,
      winMultiplier: book.totalWin,
      isBonusTriggered: book.bonusTriggered,
      isBonusBuy: bonusBuy,
      symbolsLanded: book.symbolWins
    });

    inBonus = false;
    busy = false;
  }
</script>

<header class="bar">
  <button class="back btn" onclick={() => goto('/')} aria-label="Back to hub">‹</button>
  <div class="title">{game?.meta.title ?? 'Unknown game'}</div>
  <div class="bal tabular">{fmt($balance)}<span class="muted"> cr</span></div>
</header>

{#if !game || !game.meta.playable}
  <div class="empty">
    <p>{game ? `${game.meta.title} is coming soon.` : 'Game not found.'}</p>
    <button class="btn" onclick={() => goto('/')}>Back to hub</button>
  </div>
{:else}
  <div class="stage" style="--c:{game.meta.color}">
    {#if inBonus}
      <div class="bonusband">
        FREE SPINS · {fsRemaining}/{fsTotal} left · multiplier ×{multiplier}
      </div>
    {/if}
    <div class="board" bind:this={boardEl}></div>
    {#if message}<div class="message">{message}</div>{/if}
    <div class="winrow">
      <span class="muted">WIN</span>
      <strong class="tabular" class:big={win > 0}>{fmt(win)}</strong>
    </div>
  </div>

  <div class="controls">
    <div class="betrow">
      <button class="btn" onclick={() => changeBet(-1)} disabled={busy || $bet === BET_STEPS[0]}>−</button>
      <div class="betval">
        <span class="muted">BET</span>
        <strong class="tabular">{$bet}</strong>
      </div>
      <button
        class="btn"
        onclick={() => changeBet(1)}
        disabled={busy || $bet === BET_STEPS[BET_STEPS.length - 1]}>+</button
      >
    </div>

    <button class="btn btn-primary spin" onclick={() => spin(false)} disabled={busy}>
      {busy ? '…' : 'SPIN'}
    </button>

    {#if game.meta.bonusBuyCost}
      <button class="btn btn-gold buy" onclick={() => spin(true)} disabled={busy}>
        Buy Bonus<br /><span class="small">{fmt(buyCost)} cr</span>
      </button>
    {/if}
  </div>
{/if}

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.8rem 1rem;
  }
  .back {
    font-size: 1.4rem;
    line-height: 1;
    padding: 0.3rem 0.8rem;
    border-radius: 10px;
  }
  .title {
    flex: 1;
    font-weight: 700;
    font-size: 1.1rem;
  }
  .bal {
    color: var(--gold);
    font-weight: 700;
  }
  .stage {
    margin: 0 1rem;
    background: radial-gradient(140% 120% at 50% 0%, color-mix(in srgb, var(--c) 35%, #0b0e16), #0b0e16);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 0.8rem;
    position: relative;
    min-height: 260px;
  }
  .board {
    display: flex;
    justify-content: center;
  }
  .bonusband {
    text-align: center;
    background: var(--gold);
    color: #2a1f00;
    font-weight: 800;
    font-size: 0.78rem;
    border-radius: 8px;
    padding: 0.3rem;
    margin-bottom: 0.6rem;
  }
  .message {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--gold);
    text-shadow: 0 3px 12px rgba(0, 0, 0, 0.7);
    pointer-events: none;
  }
  .winrow {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.6rem;
  }
  .winrow strong {
    font-size: 1.5rem;
  }
  .winrow strong.big {
    color: var(--good);
  }
  .controls {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.6rem;
    align-items: stretch;
    padding: 1rem;
  }
  .betrow {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .betval {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 56px;
  }
  .betval span {
    font-size: 0.6rem;
    letter-spacing: 1px;
  }
  .betval strong {
    font-size: 1.2rem;
  }
  .spin {
    font-size: 1.3rem;
    letter-spacing: 1px;
  }
  .buy {
    text-align: center;
    line-height: 1.1;
  }
  .small {
    font-size: 0.66rem;
  }
  .empty {
    text-align: center;
    padding: 3rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
</style>
