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
  import WinPopup from '$lib/components/WinPopup.svelte';
  import BonusIntro from '$lib/components/BonusIntro.svelte';
  import BetControl from '$lib/components/BetControl.svelte';
  import WalletCapsule from '$lib/components/WalletCapsule.svelte';
  import GameShell from '$lib/components/GameShell.svelte';

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
  let bonusIntro = $state<number | null>(null);
  let showInfo = $state(false);

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

  // Win popup: shown for any meaningful win (>= 5x bet). Tier sets label + colour.
  let winPopup = $state<{ amount: number; label: string; accent: string } | null>(null);
  function winTierPopup(mult: number, credits: number) {
    if (mult >= 200) return { amount: credits, label: 'EPIC WIN', accent: '#b06bff' };
    if (mult >= 75) return { amount: credits, label: 'MEGA WIN', accent: '#f1c232' };
    if (mult >= 20) return { amount: credits, label: 'BIG WIN', accent: '#19c3c9' };
    if (mult >= 5) return { amount: credits, label: 'NICE WIN', accent: '#1fd35b' };
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
    winPopup = null;
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
        onBonusAward: (count) => (bonusIntro = count),
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

    inBonus = false;
    busy = false;

    const tier = winTierPopup(book.totalWin, payout);
    if (tier) winPopup = tier;
  }
</script>

<GameShell>
  {#snippet header()}
    <header class="topbar">
      <button class="icon-btn" onclick={() => goto(`${base}/`)} aria-label="Back to hub">‹</button>
      <div class="title">{game?.meta.title ?? 'Unknown game'}</div>
      <WalletCapsule compact />
    </header>
  {/snippet}

  {#snippet canvas()}
    {#if !game || !game.meta.playable}
      <div class="empty">
        <p>{game ? `${game.meta.title} is coming soon.` : 'Game not found.'}</p>
        <button class="btn" onclick={() => goto(`${base}/`)}>Back to hub</button>
      </div>
    {:else}
      <div class="board" class:bonus={inBonus} bind:this={boardEl} style="--c:{game.meta.color}"></div>
      <div class="meter">
        <button class="icon-btn sm" onclick={toggleSound} aria-label="Toggle sound">
          {$settings.soundOn ? '🔊' : '🔇'}
        </button>
        {#if inBonus}
          <div class="bonus">FREE SPINS · {fsRemaining}/{fsTotal} · ×{multiplier}</div>
        {:else}
          <div class="win" class:has={win > 0}>
            <span class="muted">WIN</span><strong class="tabular">{fmt(displayWin)}</strong>
          </div>
        {/if}
        <button class="icon-btn sm" onclick={() => (showInfo = true)} aria-label="Game info">ⓘ</button>
      </div>
      {#if message}<div class="overlay message">{message}</div>{/if}
    {/if}
  {/snippet}

  {#snippet controls()}
    {#if game && game.meta.playable}
      <section class="panel">
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
  {/snippet}
</GameShell>

{#if showInfo && game}
  <GameInfo {game} onClose={() => (showInfo = false)} />
{/if}

{#if winPopup}
  <WinPopup
    amount={winPopup.amount}
    label={winPopup.label}
    accent={winPopup.accent}
    onClose={() => (winPopup = null)}
  />
{/if}

{#if bonusIntro !== null}
  <BonusIntro count={bonusIntro} onClose={() => (bonusIntro = null)} />
{/if}

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.7rem;
    flex: none;
  }
  .topbar .title {
    flex: 1;
    text-align: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.5px;
  }
  /* Win/free-spins meter overlays the top of the full-bleed board. */
  .meter {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.7rem;
    background: linear-gradient(180deg, rgba(15, 33, 46, 0.85), transparent);
    pointer-events: none;
  }
  .meter .icon-btn {
    pointer-events: auto;
  }
  .meter .win {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }
  .meter .win span {
    font-size: 0.6rem;
    letter-spacing: 1px;
  }
  .meter .win strong {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.55rem;
    color: var(--muted);
    transition: color 0.2s ease, text-shadow 0.2s ease;
  }
  .meter .win.has strong {
    color: var(--good);
    text-shadow: 0 0 18px color-mix(in srgb, var(--good) 70%, transparent);
  }
  .bonus {
    flex: 1;
    text-align: center;
    background: linear-gradient(180deg, #ffe39a, var(--gold));
    color: #2a1f00;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.74rem;
    letter-spacing: 0.5px;
    border-radius: 8px;
    padding: 0.35rem 0.6rem;
    margin: 0 0.4rem;
  }
  .icon-btn.sm {
    width: 32px;
    height: 32px;
    font-size: 0.95rem;
  }

  /* Full-bleed board: fills the entire canvas region, no boxed card. */
  .board {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background:
      radial-gradient(130% 80% at 50% -5%, color-mix(in srgb, var(--c) 40%, transparent), transparent 55%),
      radial-gradient(80% 60% at 15% 110%, color-mix(in srgb, var(--magenta) 16%, transparent), transparent 60%),
      radial-gradient(80% 60% at 85% 110%, color-mix(in srgb, var(--cyan) 14%, transparent), transparent 60%),
      #0a0816;
    transition: box-shadow 0.3s ease;
  }
  /* Free-spins mode: a warm pulsing frame so the board itself feels "in bonus". */
  .board.bonus {
    box-shadow:
      inset 0 0 0 2px rgba(255, 209, 74, 0.65),
      inset 0 0 38px rgba(255, 170, 40, 0.28);
    animation: bonusPulse 1.4s ease-in-out infinite;
  }
  @keyframes bonusPulse {
    50% {
      box-shadow:
        inset 0 0 0 2px rgba(255, 226, 154, 0.95),
        inset 0 0 60px rgba(255, 180, 50, 0.45);
    }
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
  .panel {
    background: var(--panel-grad);
    border-top: 1px solid var(--line);
    padding: 0.6rem 0.7rem;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .controls {
    display: grid;
    grid-template-columns: 1fr 42%;
    gap: 0.6rem;
    align-items: end;
  }
  .spin {
    height: 100%;
    min-height: 48px;
    font-family: var(--font-display);
    font-size: 1.15rem;
    letter-spacing: 2px;
  }
  .buy {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.5rem;
    font-weight: 600;
    font-size: 0.85rem;
  }
  .empty {
    position: absolute;
    inset: 0;
    text-align: center;
    padding: 3rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    justify-content: center;
  }
</style>
