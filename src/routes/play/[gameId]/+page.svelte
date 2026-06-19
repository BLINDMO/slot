<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { getGame } from '$games/index';
  import { balance, bet, settings } from '$store/state';
  import { recordSpin } from '$store/db';
  import { mulberry32, randomSeed } from '$engine/rng';
  import { SlotRenderer } from '$lib/render/SlotRenderer';
  import { playBook } from '$lib/render/player';
  import { sfx } from '$lib/audio';
  import { gsap } from 'gsap';
  import GameInfo from '$lib/components/GameInfo.svelte';
  import BetControl from '$lib/components/BetControl.svelte';
  import BalanceChip from '$lib/components/BalanceChip.svelte';

  const gameId = page.params.gameId ?? '';
  const game = getGame(gameId);

  // One RNG per play session (non-reproducible real play).
  const rng = mulberry32(randomSeed());

  let boardEl = $state<HTMLDivElement>();
  let renderer: SlotRenderer | null = null;

  let busy = $state(false);
  let win = $state(0);
  let displayWin = $state(0);
  let winTween: gsap.core.Tween | null = null;
  let multiplier = $state(1);
  let fsRemaining = $state(0);
  let fsTotal = $state(0);
  let message = $state<string | null>(null);
  let inBonus = $state(false);
  let showInfo = $state(false);
  let banner = $state<{ label: string; cls: string } | null>(null);

  /** Roll the displayed win counter up to a new target for a satisfying count-up. */
  function rollWinTo(target: number) {
    winTween?.kill();
    const proxy = { v: displayWin };
    winTween = gsap.to(proxy, {
      v: target,
      duration: target > displayWin ? 0.5 : 0,
      ease: 'power1.out',
      onUpdate: () => (displayWin = proxy.v)
    });
  }

  const fmt = (n: number) => Math.round(n).toLocaleString();
  const buyCost = $derived(game && game.meta.bonusBuyCost ? game.meta.bonusBuyCost * $bet : 0);

  function winTier(mult: number): { label: string; cls: string } | null {
    if (mult >= 200) return { label: 'EPIC WIN', cls: 'epic' };
    if (mult >= 75) return { label: 'MEGA WIN', cls: 'mega' };
    if (mult >= 20) return { label: 'BIG WIN', cls: 'big' };
    return null;
  }

  onMount(async () => {
    if (!game || !game.meta.playable || !boardEl) return;
    renderer = new SlotRenderer(gameId, game.layout.cols, game.layout.rows, game.meta.color);
    await renderer.mount(boardEl);
    await renderer.renderBoard(game.preview(rng), false);
  });

  onDestroy(() => renderer?.destroy());

  function toggleSound() {
    settings.update((s) => ({ ...s, soundOn: !s.soundOn }));
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
    banner = null;
    win = 0;
    displayWin = 0;
    multiplier = 1;
    sfx.unlock();
    if ($settings.soundOn) sfx.spin();

    balance.update((b) => b - cost);

    const book = game.spin(rng, { bonusBuy });

    await playBook(
      renderer!,
      book,
      $bet,
      {
        onWin: (c) => {
          win = c;
          rollWinTo(c);
        },
        onMultiplier: (m) => (multiplier = m),
        onFreeSpins: (rem, tot) => {
          fsRemaining = rem;
          fsTotal = tot;
          inBonus = tot > 0;
        },
        onBonusIntro: () => (inBonus = true),
        onMessage: (m) => (message = m)
      },
      $settings.soundOn
    );

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

    const tier = winTier(book.totalWin);
    if (tier) {
      banner = tier;
      setTimeout(() => (banner = null), 1800);
    }

    inBonus = false;
    busy = false;
  }
</script>

<header class="topbar">
  <button class="icon-btn" onclick={() => goto(`${base}/`)} aria-label="Back to hub">‹</button>
  <div class="title">{game?.meta.title ?? 'Unknown game'}</div>
  <div class="actions">
    {#if game?.meta.playable}
      <button class="icon-btn" onclick={() => (showInfo = true)} aria-label="Game info">ⓘ</button>
    {/if}
    <BalanceChip />
  </div>
</header>

{#if !game || !game.meta.playable}
  <div class="empty">
    <p>{game ? `${game.meta.title} is coming soon.` : 'Game not found.'}</p>
    <button class="btn" onclick={() => goto(`${base}/`)}>Back to hub</button>
  </div>
{:else}
  <section class="stage">
    {#if inBonus}
      <div class="bonusband">
        <span>FREE SPINS</span>
        <span>{fsRemaining}/{fsTotal} LEFT</span>
        <span>×{multiplier}</span>
      </div>
    {/if}
    <div class="board" bind:this={boardEl} style="--c:{game.meta.color}"></div>
    {#if message}<div class="overlay message">{message}</div>{/if}
    {#if banner}<div class="overlay banner {banner.cls}">{banner.label}</div>{/if}
  </section>

  <section class="panel">
    <div class="hud">
      <button class="icon-btn" onclick={toggleSound} aria-label="Toggle sound">
        {$settings.soundOn ? '🔊' : '🔇'}
      </button>
      <div class="win" class:has={win > 0}>
        <span class="muted">WIN</span>
        <strong class="tabular">{fmt(displayWin)}</strong>
      </div>
      <div class="spacer"></div>
    </div>

    <div class="controls">
      <BetControl disabled={busy} />
      <button class="btn btn-primary spin" onclick={() => spin(false)} disabled={busy}>
        {busy ? '···' : 'SPIN'}
      </button>
    </div>

    {#if game.meta.bonusBuyCost}
      <button class="btn btn-gold buy" onclick={() => spin(true)} disabled={busy}>
        Buy Bonus <span class="tabular">· {fmt(buyCost)}</span>
      </button>
    {/if}
  </section>
{/if}

{#if showInfo && game}
  <GameInfo {game} onClose={() => (showInfo = false)} />
{/if}

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.8rem;
  }
  .topbar .title {
    flex: 1;
    text-align: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.5px;
  }
  .actions {
    display: flex;
    gap: 0.4rem;
  }

  .stage {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    margin: 0.5rem 0.6rem;
    padding: 0.7rem;
    border-radius: var(--radius-lg);
    /* A themed cabinet so empty space reads as atmosphere, not dead black. */
    background:
      radial-gradient(120% 70% at 50% 0%, color-mix(in srgb, var(--c) 32%, transparent), transparent 62%),
      var(--panel-grad);
    border: 1px solid var(--line);
    box-shadow: inset 0 0 70px rgba(0, 0, 0, 0.55);
    overflow: hidden;
  }
  .board {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: grid;
    place-items: center;
  }
  /* The canvas draws its own framed background; size it to the reels exactly so
     there's no big empty bordered box on small grids. */
  .board :global(canvas) {
    border-radius: var(--radius-lg);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--c) 45%, transparent),
      0 0 26px color-mix(in srgb, var(--c) 25%, transparent),
      var(--shadow-2);
  }

  .bonusband {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background: linear-gradient(180deg, #ffe39a, var(--gold));
    color: #2a1f00;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.72rem;
    letter-spacing: 0.5px;
    border-radius: 10px;
    padding: 0.45rem 0.8rem;
    margin-bottom: 0.6rem;
    box-shadow: 0 2px 12px rgba(232, 196, 104, 0.45);
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    text-align: center;
  }
  .message {
    font-family: var(--font-display);
    font-size: 1.7rem;
    font-weight: 800;
    color: var(--gold);
    text-shadow: 0 3px 16px rgba(0, 0, 0, 0.8);
  }
  .banner {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 2.4rem;
    letter-spacing: 1px;
    animation: pop 0.4s cubic-bezier(0.2, 1.4, 0.3, 1);
  }
  .banner.big {
    color: #7be0ff;
    text-shadow: 0 0 24px rgba(123, 224, 255, 0.7), 0 3px 10px rgba(0, 0, 0, 0.7);
  }
  .banner.mega {
    color: #ffd34d;
    font-size: 2.8rem;
    text-shadow: 0 0 28px rgba(255, 211, 77, 0.8), 0 3px 10px rgba(0, 0, 0, 0.7);
  }
  .banner.epic {
    color: #ff7be0;
    font-size: 3.1rem;
    text-shadow: 0 0 34px rgba(255, 123, 224, 0.85), 0 3px 12px rgba(0, 0, 0, 0.8);
  }
  @keyframes pop {
    from {
      transform: scale(0.5);
      opacity: 0;
    }
  }

  .panel {
    background: var(--panel-grad);
    border-top: 1px solid var(--line);
    padding: 0.7rem 0.9rem calc(0.9rem + env(safe-area-inset-bottom));
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.35);
  }
  .hud {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }
  .hud .spacer {
    width: 38px;
  }
  .win {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }
  .win span {
    font-size: 0.6rem;
    letter-spacing: 1px;
  }
  .win strong {
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--muted);
    transition: color 0.2s ease;
  }
  .win.has strong {
    color: var(--good);
  }

  .controls {
    display: grid;
    grid-template-columns: 1fr 42%;
    gap: 0.6rem;
    align-items: end;
  }
  .spin {
    height: 100%;
    min-height: 52px;
    font-family: var(--font-display);
    font-size: 1.2rem;
    letter-spacing: 2px;
  }
  .buy {
    width: 100%;
    margin-top: 0.6rem;
    font-weight: 600;
    font-size: 0.9rem;
  }
  .empty {
    flex: 1;
    text-align: center;
    padding: 3rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    justify-content: center;
  }
</style>
