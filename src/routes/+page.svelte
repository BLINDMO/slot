<script lang="ts">
  import { GAMES } from '$games/index';
  import { balance } from '$store/state';
  import InstallPrompt from '$lib/components/InstallPrompt.svelte';

  const fmt = (n: number) => Math.round(n).toLocaleString();
</script>

<header class="top">
  <div>
    <h1>Slot Hub</h1>
    <p class="muted tagline">A personal arcade · virtual credits only</p>
  </div>
  <a class="balance" href="/admin" title="Admin dashboard">
    <span class="muted">CREDITS</span>
    <strong class="tabular">{fmt($balance)}</strong>
  </a>
</header>

<InstallPrompt />

<div class="grid">
  {#each GAMES as g (g.meta.id)}
    {#if g.meta.playable}
      <a class="tile" href="/play/{g.meta.id}" style="--c:{g.meta.color}">
        <div class="art"><span>{g.meta.title}</span></div>
        <div class="info">
          <strong>{g.meta.title}</strong>
          <span class="muted small">{g.meta.mechanic}</span>
          <div class="tags">
            <span class="tag">{g.meta.volatility}</span>
            <span class="tag">RTP {(g.meta.targetRtp * 100).toFixed(1)}%</span>
            <span class="tag">{g.meta.maxWin.toLocaleString()}x</span>
          </div>
        </div>
      </a>
    {:else}
      <div class="tile soon" style="--c:{g.meta.color}">
        <div class="art"><span>{g.meta.title}</span></div>
        <div class="info">
          <strong>{g.meta.title}</strong>
          <span class="muted small">{g.meta.mechanic}</span>
          <div class="tags"><span class="tag soon-tag">Coming soon</span></div>
        </div>
      </div>
    {/if}
  {/each}
</div>

<footer class="foot muted small">
  Single-player · no real-money wagering · no cash-out · data stored on this device only.
</footer>

<style>
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.2rem 1rem 0.6rem;
  }
  h1 {
    margin: 0;
    font-size: 1.6rem;
    letter-spacing: 0.5px;
  }
  .tagline {
    margin: 0.2rem 0 0;
    font-size: 0.8rem;
  }
  .balance {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 0.5rem 0.8rem;
  }
  .balance span {
    font-size: 0.62rem;
    letter-spacing: 1px;
  }
  .balance strong {
    font-size: 1.2rem;
    color: var(--gold);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
    padding: 0.6rem 1rem 1rem;
  }
  .tile {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.06s ease, border-color 0.15s ease;
  }
  .tile:active {
    transform: scale(0.98);
  }
  .tile:not(.soon):hover {
    border-color: var(--c);
  }
  .art {
    height: 96px;
    background: radial-gradient(120% 120% at 30% 20%, color-mix(in srgb, var(--c) 85%, white 0%), #0b0e16 90%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .art span {
    font-weight: 800;
    font-size: 1rem;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    text-align: center;
    padding: 0 0.5rem;
  }
  .soon .art {
    filter: grayscale(0.7) brightness(0.7);
  }
  .info {
    padding: 0.6rem 0.7rem 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .small {
    font-size: 0.72rem;
    line-height: 1.25;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.2rem;
  }
  .tag {
    font-size: 0.62rem;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 0.15rem 0.4rem;
    color: var(--muted);
  }
  .soon-tag {
    color: var(--gold);
  }
  .foot {
    text-align: center;
    padding: 0.5rem 1rem 2rem;
    line-height: 1.5;
  }
</style>
