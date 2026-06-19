<script lang="ts">
  import { base } from '$app/paths';
  import { GAMES } from '$games/index';
  import { INSTANT_GAMES } from '$lib/instant/registry';
  import InstallPrompt from '$lib/components/InstallPrompt.svelte';
  import WalletCapsule from '$lib/components/WalletCapsule.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';

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

  let q = $state('');
  let searchEl = $state<HTMLInputElement>();

  const match = (title: string) => title.toLowerCase().includes(q.trim().toLowerCase());
  const originals = $derived(INSTANT_GAMES.filter((g) => match(g.title)));
  const slots = $derived(GAMES.filter((g) => match(g.meta.title)));
</script>

<header class="topbar">
  <div class="brand"><span class="mark">🎰</span><span class="word">SLOT HUB</span></div>
  <WalletCapsule />
</header>

<div class="search">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" stroke-linecap="round" />
  </svg>
  <input bind:this={searchEl} bind:value={q} placeholder="Search your game" />
</div>

<div class="scroll">
  <InstallPrompt />

  {#if originals.length}
    <section class="row">
      <div class="rowhead">
        <span class="rhicon" style="color:var(--blue-2)">★</span>
        <h2>Originals</h2>
        <span class="count">{originals.length}</span>
      </div>
      <div class="cards">
        {#each originals as g (g.id)}
          <a class="card" href="{base}/instant/{g.id}" style="--c:{g.color}">
            <div class="thumb">
              <span class="deco">{DECO[g.id] ?? '🎲'}</span>
              <span class="rtp">99% RTP</span>
              <div class="scrim"><strong>{g.title}</strong></div>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if slots.length}
    <section class="row">
      <div class="rowhead">
        <span class="rhicon">🎰</span>
        <h2>Slots</h2>
        <span class="count">{slots.length}</span>
      </div>
      <div class="cards">
        {#each slots as g (g.meta.id)}
          {#if g.meta.playable}
            <a class="card" href="{base}/play/{g.meta.id}" style="--c:{g.meta.color}">
              <div class="thumb">
                <span class="deco">{DECO[g.meta.id] ?? '🎰'}</span>
                <span class="rtp">{(g.meta.targetRtp * 100).toFixed(1)}%</span>
                <div class="scrim"><strong>{g.meta.title}</strong></div>
              </div>
            </a>
          {:else}
            <div class="card soon" style="--c:{g.meta.color}">
              <div class="thumb">
                <span class="deco">{DECO[g.meta.id] ?? '🎰'}</span>
                <span class="lock">🔒</span>
                <div class="scrim"><strong>{g.meta.title}</strong><em>Soon</em></div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/if}

  {#if !originals.length && !slots.length}
    <p class="noresult muted">No games match “{q}”.</p>
  {/if}

  <footer class="foot muted">Virtual credits only · no real-money wagering · data stored on this device.</footer>
</div>

<BottomNav active="casino" onSearch={() => searchEl?.focus()} />

<style>
  .topbar {
    flex: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
    padding: calc(0.55rem + env(safe-area-inset-top)) 0.8rem 0.55rem;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
  }
  .mark {
    font-size: 1.35rem;
  }
  .word {
    font-weight: 800;
    font-size: 1.05rem;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .search {
    flex: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0.8rem 0.4rem;
    padding: 0 0.7rem;
    background: var(--input);
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  .search svg {
    width: 18px;
    height: 18px;
    color: var(--muted);
    flex: none;
  }
  .search input {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    color: var(--text);
    font: inherit;
    font-size: 0.92rem;
    padding: 0.6rem 0;
  }
  .search input:focus {
    outline: none;
  }
  .search input::placeholder {
    color: var(--muted);
  }

  .scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .row {
    margin-bottom: 0.4rem;
  }
  .rowhead {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.85rem 0.45rem;
  }
  .rhicon {
    font-size: 1rem;
  }
  .rowhead h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }
  .count {
    font-size: 0.7rem;
    color: var(--muted);
    background: var(--panel);
    border-radius: 999px;
    padding: 0.05rem 0.45rem;
  }

  .cards {
    display: flex;
    gap: 0.6rem;
    overflow-x: auto;
    padding: 0 0.85rem 0.3rem;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
  }
  .card {
    flex: 0 0 auto;
    width: 118px;
    scroll-snap-align: start;
    border-radius: 10px;
    transition: transform 0.08s ease;
  }
  .card:active {
    transform: scale(0.97);
  }
  .thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    border-radius: 10px;
    overflow: hidden;
    display: grid;
    place-items: center;
    background:
      radial-gradient(120% 90% at 30% 12%, color-mix(in srgb, var(--c) 85%, black 0%), #0b1922 92%);
    box-shadow: var(--shadow-1);
  }
  .deco {
    font-size: 2.9rem;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.55));
  }
  .rtp {
    position: absolute;
    top: 0.4rem;
    left: 0.4rem;
    font-size: 0.55rem;
    font-weight: 700;
    color: #cfe9ff;
    background: rgba(0, 0, 0, 0.45);
    border-radius: 6px;
    padding: 0.12rem 0.35rem;
  }
  .lock {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    font-size: 0.9rem;
  }
  .soon .thumb {
    filter: grayscale(0.7) brightness(0.62);
  }
  .scrim {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0.9rem 0.5rem 0.4rem;
    background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.82));
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .scrim strong {
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.15;
  }
  .scrim em {
    font-style: normal;
    font-size: 0.6rem;
    color: var(--gold);
  }

  .noresult {
    text-align: center;
    padding: 2rem 1rem;
  }
  .foot {
    text-align: center;
    padding: 0.6rem 1rem 1rem;
    font-size: 0.66rem;
    line-height: 1.5;
  }
</style>
