<script lang="ts">
  import { base } from '$app/paths';
  import { GAMES } from '$games/index';
  import { INSTANT_GAMES } from '$lib/instant/registry';
  import InstallPrompt from '$lib/components/InstallPrompt.svelte';
  import BalanceChip from '$lib/components/BalanceChip.svelte';

  // Decorative emoji per game for the tile art (purely cosmetic).
  const DECO: Record<string, string> = {
    blackwaterBay: '🏴‍☠️',
    vaultbreakers: '🏦',
    highNoon: '🤠',
    forgeOfValhalla: '⚒️',
    luckySevens: '🍒',
    novaDrift: '🚀',
    plinko: '🔵',
    keno: '🎯'
  };
</script>

<header class="brand">
  <div class="logo">
    <span class="mark">🎰</span>
    <h1>SLOT HUB</h1>
  </div>
  <div class="brand-actions">
    <BalanceChip />
    <a class="icon-btn" href="{base}/admin" aria-label="Admin dashboard">📊</a>
  </div>
</header>

<InstallPrompt />

<div class="scroll">
  <h2 class="section">Slots</h2>
  <div class="grid">
    {#each GAMES as g (g.meta.id)}
      {#if g.meta.playable}
        <a class="tile" href="{base}/play/{g.meta.id}" style="--c:{g.meta.color}">
          <div class="art"><span class="deco">{DECO[g.meta.id] ?? '🎰'}</span></div>
          <div class="info">
            <strong>{g.meta.title}</strong>
            <div class="tags">
              <span class="tag">{g.meta.volatility}</span>
              <span class="tag">{g.meta.maxWin.toLocaleString()}×</span>
            </div>
          </div>
        </a>
      {:else}
        <div class="tile soon" style="--c:{g.meta.color}">
          <div class="art">
            <span class="deco">{DECO[g.meta.id] ?? '🎰'}</span>
            <span class="lock">🔒</span>
          </div>
          <div class="info">
            <strong>{g.meta.title}</strong>
            <div class="tags"><span class="tag soon-tag">Coming soon</span></div>
          </div>
        </div>
      {/if}
    {/each}
  </div>

  <h2 class="section">Instant Games <span class="edge">99% RTP</span></h2>
  <div class="grid">
    {#each INSTANT_GAMES as g (g.id)}
      <a class="tile instant" href="{base}/instant/{g.id}" style="--c:{g.color}">
        <div class="art"><span class="deco">{DECO[g.id] ?? '🎲'}</span></div>
        <div class="info">
          <strong>{g.title}</strong>
          <div class="tags">
            <span class="tag gold">RTP 99%</span>
            <span class="tag">{g.maxWin.toLocaleString()}×</span>
          </div>
        </div>
      </a>
    {/each}
  </div>

  <footer class="foot muted">
    Single-player · no real-money wagering · data stored on this device only.
  </footer>
</div>

<style>
  .brand {
    flex: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: calc(0.6rem + env(safe-area-inset-top)) 0.9rem 0.6rem;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .mark {
    font-size: 1.5rem;
  }
  h1 {
    margin: 0;
    font-size: 1.2rem;
    letter-spacing: 1px;
  }
  .brand-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }
  .section {
    margin: 0.8rem 0.9rem 0.5rem;
    font-size: 0.8rem;
    color: var(--muted);
    letter-spacing: 1px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .edge {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    letter-spacing: 0.5px;
    color: var(--gold);
    border: 1px solid color-mix(in srgb, var(--gold) 40%, transparent);
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
    text-transform: none;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.7rem;
    padding: 0 0.9rem;
  }
  .tile {
    background: var(--panel-grad);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-1);
    transition: transform 0.06s ease, border-color 0.15s ease;
  }
  .tile:active {
    transform: scale(0.98);
  }
  .tile:not(.soon):hover {
    border-color: var(--c);
  }
  .art {
    position: relative;
    height: 78px;
    display: grid;
    place-items: center;
    background: radial-gradient(120% 120% at 30% 15%, color-mix(in srgb, var(--c) 80%, black 0%), #0b0e16 92%);
  }
  .tile.instant .art {
    background: radial-gradient(120% 120% at 30% 15%, color-mix(in srgb, var(--c) 70%, black 0%), #06080e 92%);
  }
  .art .deco {
    font-size: 2.3rem;
    filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.5));
  }
  .soon .art {
    filter: grayscale(0.75) brightness(0.6);
  }
  .lock {
    position: absolute;
    top: 0.4rem;
    right: 0.5rem;
    font-size: 0.9rem;
  }
  .info {
    padding: 0.5rem 0.6rem 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .info strong {
    font-family: var(--font-display);
    font-size: 0.82rem;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .tag {
    font-size: 0.58rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 0.12rem 0.4rem;
    color: var(--muted);
  }
  .tag.gold {
    color: var(--gold);
    border-color: color-mix(in srgb, var(--gold) 40%, transparent);
  }
  .soon-tag {
    color: var(--gold);
  }
  .foot {
    text-align: center;
    padding: 1rem 1rem 0;
    line-height: 1.5;
    font-size: 0.66rem;
  }
</style>
