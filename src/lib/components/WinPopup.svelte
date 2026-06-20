<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let {
    amount,
    label = 'WIN',
    accent = '#1fd35b',
    onClose
  }: { amount: number; label?: string; accent?: string; onClose: () => void } = $props();

  const fmt = (n: number) => Math.round(n).toLocaleString();

  // Confetti pieces (DOM, CSS-animated — no deps).
  const colors = ['#1fd35b', '#1475e1', '#f1c232', '#e6504f', '#b06bff', '#19c3c9'];
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    x: Math.round((i / 28) * 100),
    delay: Math.round(Math.random() * 400),
    dur: 1100 + Math.round(Math.random() * 900),
    rot: Math.round(Math.random() * 360),
    color: colors[i % colors.length],
    drift: Math.round((Math.random() - 0.5) * 80)
  }));

  let timer: ReturnType<typeof setTimeout>;
  onMount(() => {
    timer = setTimeout(onClose, 2600);
  });
  onDestroy(() => clearTimeout(timer));
</script>

<button class="overlay" onclick={onClose} aria-label="Collect win">
  <div class="confetti">
    {#each pieces as p}
      <span
        style="left:{p.x}%; background:{p.color}; animation-delay:{p.delay}ms; animation-duration:{p.dur}ms; --drift:{p.drift}px; --rot:{p.rot}deg"
      ></span>
    {/each}
  </div>

  <div class="card" style="--a:{accent}">
    <div class="rays"></div>
    <div class="label">{label}</div>
    <div class="amount">
      <span class="coin"></span><strong class="tabular">{fmt(amount)}</strong>
    </div>
    <div class="tap">tap to collect</div>
  </div>
</button>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: grid;
    place-items: center;
    background: radial-gradient(circle at 50% 45%, rgba(8, 16, 24, 0.55), rgba(4, 8, 12, 0.86));
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    border: none;
    animation: fade 0.18s ease;
  }
  .card {
    position: relative;
    padding: 1.6rem 2.4rem;
    border-radius: 20px;
    background: linear-gradient(180deg, #20384a, #142433);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--a) 70%, transparent),
      0 0 60px color-mix(in srgb, var(--a) 45%, transparent),
      0 24px 60px rgba(0, 0, 0, 0.6);
    text-align: center;
    animation: pop 0.5s cubic-bezier(0.18, 1.5, 0.4, 1);
    overflow: hidden;
  }
  .rays {
    position: absolute;
    inset: -40%;
    background: conic-gradient(
      from 0deg,
      color-mix(in srgb, var(--a) 22%, transparent) 0 8deg,
      transparent 8deg 30deg
    );
    opacity: 0.5;
    animation: spin 9s linear infinite;
    z-index: 0;
  }
  .label,
  .amount,
  .tap {
    position: relative;
    z-index: 1;
  }
  .label {
    font-weight: 800;
    font-size: 1.4rem;
    letter-spacing: 2px;
    color: var(--a);
    text-shadow: 0 0 16px color-mix(in srgb, var(--a) 60%, transparent);
  }
  .amount {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.4rem;
  }
  .coin {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #ffe39a, #f1c232 65%, #b8860b 100%);
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.25);
  }
  .amount strong {
    font-size: 2.4rem;
    font-weight: 800;
    color: #fff;
  }
  .tap {
    margin-top: 0.6rem;
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 0.5px;
  }

  .confetti {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .confetti span {
    position: absolute;
    top: -8%;
    width: 8px;
    height: 12px;
    border-radius: 2px;
    animation-name: fall;
    animation-timing-function: ease-in;
    animation-iteration-count: 1;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes pop {
    from {
      transform: scale(0.4);
      opacity: 0;
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes fall {
    to {
      transform: translate(var(--drift), 115vh) rotate(var(--rot));
      opacity: 0;
    }
  }
</style>
