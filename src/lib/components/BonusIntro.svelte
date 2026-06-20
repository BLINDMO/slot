<script lang="ts">
  import { onMount } from 'svelte';

  let { count, onClose }: { count: number; onClose: () => void } = $props();

  let closing = $state(false);

  function done() {
    if (closing) return;
    closing = true;
    setTimeout(onClose, 260);
  }

  onMount(() => {
    // Auto-advance; the book player waits the same beat so timing stays aligned.
    const t = setTimeout(done, 2000);
    return () => clearTimeout(t);
  });
</script>

<button class="scrim" class:closing onclick={done} aria-label="Start free spins">
  <div class="rays"></div>
  <div class="burst">
    {#each Array(16) as _, i}
      <span class="spark" style="--a:{(360 / 16) * i}deg; --d:{0.04 * (i % 5)}s"></span>
    {/each}
  </div>
  <div class="card">
    <span class="kicker">BONUS UNLOCKED</span>
    <strong class="title">FREE SPINS</strong>
    <div class="count"><span class="num">{count}</span><span class="unit">SPINS</span></div>
    <span class="hint">Tap to begin</span>
  </div>
</button>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    border: none;
    background: radial-gradient(120% 90% at 50% 45%, rgba(30, 16, 4, 0.85), rgba(4, 3, 10, 0.95));
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    opacity: 1;
    transition: opacity 0.26s ease;
  }
  /* Fade only on exit, via a class toggle — the overlay is never opacity:0 at
     rest, so a throttled animation clock can't leave it stuck invisible. */
  .scrim.closing {
    opacity: 0;
  }

  /* Rotating golden rays behind the title. */
  .rays {
    position: absolute;
    width: 150vmax;
    height: 150vmax;
    background: repeating-conic-gradient(
      from 0deg,
      rgba(255, 209, 74, 0.16) 0deg 7deg,
      transparent 7deg 16deg
    );
    animation: spin 14s linear infinite;
    mask: radial-gradient(circle, #000 12%, transparent 62%);
    -webkit-mask: radial-gradient(circle, #000 12%, transparent 62%);
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    text-align: center;
    /* Scale-only entrance (opacity stays 1) so the card can't freeze hidden. */
    animation: pop 0.5s cubic-bezier(0.2, 1.4, 0.4, 1);
  }
  @keyframes pop {
    0% {
      transform: scale(0.4);
    }
    60% {
      transform: scale(1.08);
    }
    100% {
      transform: scale(1);
    }
  }
  .kicker {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 4px;
    color: #ffe39a;
    text-shadow: 0 0 12px rgba(255, 209, 74, 0.6);
  }
  .title {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 2.9rem;
    line-height: 0.95;
    letter-spacing: 1px;
    background: linear-gradient(180deg, #fff6db, #ffd24a 55%, #e89b1c);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 4px 18px rgba(255, 180, 40, 0.55));
  }
  .count {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin-top: 0.3rem;
  }
  .num {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 3.4rem;
    color: #fff;
    text-shadow: 0 0 24px rgba(255, 209, 74, 0.8);
  }
  .unit {
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: 3px;
    color: #ffe39a;
  }
  .hint {
    margin-top: 0.7rem;
    font-size: 0.72rem;
    letter-spacing: 1.5px;
    color: rgba(255, 255, 255, 0.7);
    animation: blink 1.3s ease-in-out infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0.35;
    }
  }

  .burst {
    position: absolute;
    width: 1px;
    height: 1px;
  }
  .spark {
    position: absolute;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff, #ffd24a 70%);
    transform: rotate(var(--a)) translateY(0);
    animation: fly 0.9s ease-out var(--d) both;
  }
  @keyframes fly {
    0% {
      transform: rotate(var(--a)) translateY(0) scale(0.3);
      opacity: 1;
    }
    100% {
      transform: rotate(var(--a)) translateY(-220px) scale(0.9);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rays,
    .spark {
      animation: none;
    }
  }
</style>
