<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initState } from '$store/state';
  import AuroraBg from '$lib/components/AuroraBg.svelte';

  let { children } = $props();

  onMount(() => {
    void initState();
  });
</script>

<AuroraBg />

<main>
  {@render children()}
</main>

<!-- Portrait-only: the games are designed for portrait; show a rotate prompt in
     short landscape instead of a broken/overlapping layout. -->
<div class="rotate">
  <div class="rotate-card">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M12 18.5h.01" />
      <path d="M3.5 8a9 9 0 0 1 4-4" />
      <path d="M2.5 5.5 3.5 8l2.5-1" />
    </svg>
    <strong>Rotate your device</strong>
    <span>Slot Hub is best played in portrait.</span>
  </div>
</div>

<style>
  main {
    /* The ONE full-height container — 100% of the locked body. Every page fills
       it; there is no other element claiming viewport height anywhere. */
    position: relative;
    z-index: 1;
    height: 100%;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .rotate {
    display: none;
  }
  @media (orientation: landscape) and (max-height: 540px) {
    .rotate {
      display: grid;
      place-items: center;
      position: fixed;
      inset: 0;
      z-index: 500;
      background: var(--bg);
      text-align: center;
      padding: 1.5rem;
    }
    .rotate-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--text);
    }
    .rotate-card svg {
      width: 54px;
      height: 54px;
      color: var(--primary);
      animation: tilt 1.8s ease-in-out infinite;
    }
    .rotate-card strong {
      font-size: 1.2rem;
      font-weight: 700;
    }
    .rotate-card span {
      font-size: 0.85rem;
      color: var(--muted);
    }
  }
  @keyframes tilt {
    0%,
    100% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(-22deg);
    }
  }
</style>
