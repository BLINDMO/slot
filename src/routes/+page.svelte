<script lang="ts">
  import { base } from '$app/paths';
  import { GAMES } from '$games/index';
  import { INSTANT_GAMES } from '$lib/instant/registry';
  import { balance } from '$store/state';
  import InstallPrompt from '$lib/components/InstallPrompt.svelte';

  const fmt = (n: number) => Math.round(n).toLocaleString();

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

  const featured = GAMES.find((g) => g.meta.playable) ?? GAMES[0];
  const rest = GAMES.filter((g) => g.meta.id !== featured.meta.id);
</script>

<header class="brand">
  <div class="logo">
    <span class="mark">🎰</span>
    <div>
      <h1>SLOT HUB</h1>
      <p class="muted tagline">Personal arcade · virtual credits</p>
    </div>
  </div>
  <div class="brand-actions">
    <div class="pill bal">
      <span class="muted">CR</span>
      <strong class="tabular">{fmt($balance)}</strong>
    </div>
    <a class="icon-btn" href="{base}/admin" aria-label="Admin dashboard">📊</a>
  </div>
</header>

<InstallPrompt />

<a class="hero" href="{base}/play/{featured.meta.id}" style="--c:{featured.meta.color}">
  <div class="hero-art">
    <span class="deco">{DECO[featured.meta.id] ?? '🎰'}</span>
    <span class="badge">FEATURED</span>
  </div>
  <div class="hero-info">
    <strong class="hero-title">{featured.meta.title}</strong>
    <span class="muted small">{featured.meta.mechanic}</span>
    <div class="tags">
      <span class="tag">{featured.meta.volatility}</span>
      <span class="tag">RTP {(featured.meta.targetRtp * 100).toFixed(1)}%</span>
      <span class="tag gold">{featured.meta.maxWin.toLocaleString()}×</span>
    </div>
    <span class="play">PLAY ▸</span>
  </div>
</a>

<h2 class="section">All Games</h2>
<div class="grid">
  {#each rest as g (g.meta.id)}
    {#if g.meta.playable}
      <a class="tile" href="{base}/play/{g.meta.id}" style="--c:{g.meta.color}">
        <div class="art"><span class="deco">{DECO[g.meta.id] ?? '🎰'}</span></div>
        <div class="info">
          <strong>{g.meta.title}</strong>
          <span class="muted small">{g.meta.mechanic}</span>
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
          <span class="muted small">{g.meta.mechanic}</span>
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
        <span class="muted small">{g.mechanic}</span>
        <div class="tags">
          <span class="tag gold">RTP 99%</span>
          <span class="tag">{g.maxWin.toLocaleString()}×</span>
        </div>
      </div>
    </a>
  {/each}
</div>

<footer class="foot muted small">
  Single-player · no real-money wagering · no cash-out · data stored on this device only.
</footer>

<style>
  .brand {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.1rem 1rem 0.7rem;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .mark {
    font-size: 1.8rem;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5));
  }
  h1 {
    margin: 0;
    font-size: 1.35rem;
    letter-spacing: 1px;
  }
  .tagline {
    margin: 0.1rem 0 0;
    font-size: 0.72rem;
  }
  .brand-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .bal span {
    font-size: 0.62rem;
    letter-spacing: 0.5px;
  }
  .bal strong {
    font-family: var(--font-display);
    color: var(--gold);
    font-size: 1rem;
  }

  /* Featured hero */
  .hero {
    display: block;
    margin: 0.3rem 1rem 0;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--line);
    box-shadow: var(--shadow-2);
    transition: transform 0.08s ease, border-color 0.15s ease;
  }
  .hero:active {
    transform: scale(0.99);
  }
  .hero-art {
    position: relative;
    height: 130px;
    display: grid;
    place-items: center;
    background:
      radial-gradient(120% 120% at 30% 10%, color-mix(in srgb, var(--c) 90%, white 6%), #0b0e16 92%);
  }
  .hero-art .deco {
    font-size: 3.6rem;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.55));
  }
  .badge {
    position: absolute;
    top: 0.6rem;
    left: 0.6rem;
    background: rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    font-family: var(--font-display);
    font-size: 0.58rem;
    letter-spacing: 1px;
  }
  .hero-info {
    background: var(--panel-grad);
    padding: 0.8rem 0.9rem 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    position: relative;
  }
  .hero-title {
    font-family: var(--font-display);
    font-size: 1.2rem;
  }
  .play {
    position: absolute;
    right: 0.9rem;
    bottom: 0.9rem;
    background: linear-gradient(180deg, #44e08a, #1f9457);
    color: #04210f;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 1px;
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    box-shadow: 0 4px 14px rgba(47, 191, 113, 0.4);
  }

  .section {
    margin: 1.3rem 1rem 0.6rem;
    font-size: 0.9rem;
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
  .tile.instant .art {
    background: radial-gradient(120% 120% at 30% 15%, color-mix(in srgb, var(--c) 70%, black 0%), #06080e 92%);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
    padding: 0 1rem;
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
    height: 84px;
    display: grid;
    place-items: center;
    background: radial-gradient(120% 120% at 30% 15%, color-mix(in srgb, var(--c) 82%, white 0%), #0b0e16 92%);
  }
  .art .deco {
    font-size: 2.4rem;
    filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.5));
  }
  .soon .art {
    filter: grayscale(0.75) brightness(0.65);
  }
  .lock {
    position: absolute;
    top: 0.4rem;
    right: 0.5rem;
    font-size: 0.9rem;
  }
  .info {
    padding: 0.6rem 0.7rem 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .info strong {
    font-family: var(--font-display);
    font-size: 0.88rem;
  }
  .small {
    font-size: 0.7rem;
    line-height: 1.3;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.15rem;
  }
  .tag {
    font-size: 0.6rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 0.15rem 0.4rem;
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
    padding: 1.2rem 1rem 2rem;
    line-height: 1.5;
    font-size: 0.68rem;
  }
</style>
