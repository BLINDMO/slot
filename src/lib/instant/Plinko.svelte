<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gsap } from 'gsap';
  import { balance, bet } from '$store/state';
  import { recordSpin } from '$store/db';
  import BetControl from '$lib/components/BetControl.svelte';
  import { mulberry32, randomSeed } from '$engine/rng';
  import {
    MIN_ROWS,
    MAX_ROWS,
    RISKS,
    type Risk,
    dropBall,
    plinkoMultipliers
  } from './plinko';
  import { sfx } from '$lib/audio';

  const rng = mulberry32(randomSeed());
  const fmt = (n: number) => Math.round(n).toLocaleString();

  let rows = $state(12);
  let risk = $state<Risk>('medium');
  let canvas = $state<HTMLCanvasElement>();
  let wrap = $state<HTMLDivElement>();
  let flash = $state<string | null>(null);

  const multipliers = $derived(plinkoMultipliers(rows, risk));
  let ticker = $state<{ mult: number; color: string }[]>([]);

  type Ball = { x: number; y: number; scale: number; color: string; landed: boolean };
  const balls: Ball[] = [];
  const pegFlash = new Map<string, number>(); // "r:i" -> 0..1

  let W = 360;
  let H = 420;
  let dpr = 1;
  let raf = 0;

  // --- geometry -----------------------------------------------------------
  const topY = () => 24;
  const slotY = () => H - 34;
  const rowGap = () => (slotY() - topY() - 10) / (rows + 1);
  const step = () => W / (rows + 2);
  function laneX(v: number, r: number): number {
    return W / 2 + (v - r / 2) * step();
  }
  const pegY = (r: number) => topY() + r * rowGap();

  // --- colours ------------------------------------------------------------
  function lerpColor(a: number[], b: number[], t: number): string {
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  function slotColor(mult: number): string {
    const max = Math.max(...multipliers);
    const t = Math.min(1, Math.log(mult + 0.0001) / Math.log(max + 0.0001));
    // teal -> yellow -> orange -> pink
    if (t < 0.5) return lerpColor([34, 157, 143], [233, 196, 106], t / 0.5);
    if (t < 0.8) return lerpColor([233, 196, 106], [231, 111, 81], (t - 0.5) / 0.3);
    return lerpColor([231, 111, 81], [255, 61, 129], (t - 0.8) / 0.2);
  }

  function resize() {
    if (!wrap || !canvas) return;
    W = Math.min(wrap.clientWidth, 520);
    H = Math.max(320, Math.min(wrap.clientHeight, W * 1.1));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
  }

  function draw() {
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // pegs
    for (let r = 1; r <= rows; r++) {
      for (let i = 0; i <= r; i++) {
        const x = laneX(i, r);
        const y = pegY(r);
        const f = pegFlash.get(`${r}:${i}`) ?? 0;
        ctx.beginPath();
        ctx.arc(x, y, 3 + f * 2, 0, Math.PI * 2);
        ctx.fillStyle = f > 0 ? `rgba(255,255,255,${0.6 + f * 0.4})` : 'rgba(200,212,235,0.55)';
        ctx.fill();
        if (f > 0) pegFlash.set(`${r}:${i}`, Math.max(0, f - 0.06));
      }
    }

    // slots
    const sw = step() * 0.92;
    for (let k = 0; k <= rows; k++) {
      const x = laneX(k, rows) - sw / 2;
      const col = slotColor(multipliers[k]);
      ctx.fillStyle = col;
      roundRect(ctx, x, slotY() - 12, sw, 26, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.font = `700 ${Math.min(11, sw * 0.34)}px Rubik, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = multipliers[k] >= 100 ? `${multipliers[k]}` : `${multipliers[k]}x`;
      ctx.fillText(label, x + sw / 2, slotY() + 1);
    }

    // balls
    for (const b of balls) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6 * b.scale, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    raf = requestAnimationFrame(draw);
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drop() {
    if ($balance < $bet) {
      flash = 'Not enough credits';
      setTimeout(() => (flash = null), 1100);
      return;
    }
    balance.update((b) => b - $bet);
    sfx.unlock();
    sfx.spin();

    const res = dropBall(rng, rows, risk);
    const accent = '#19c3c9';
    const ball: Ball = { x: W / 2, y: topY() - 8, scale: 1, color: accent, landed: false };
    balls.push(ball);

    const tl = gsap.timeline({
      onComplete: () => {
        const idx = balls.indexOf(ball);
        if (idx >= 0) balls.splice(idx, 1);
        settle(res.slot, res.multiplier);
      }
    });
    // Fall through each row, flashing the nearest peg and squashing on contact.
    for (let r = 1; r <= rows; r++) {
      const v = res.lane[r];
      tl.to(ball, {
        x: laneX(v, r),
        y: pegY(r),
        duration: 0.085,
        ease: 'power1.in',
        onStart: () => {
          pegFlash.set(`${r}:${Math.round(v)}`, 1);
          if (r % 3 === 0) sfx.reelStop();
        }
      });
      tl.to(ball, { scale: 0.7, duration: 0.03 }, '<');
      tl.to(ball, { scale: 1, duration: 0.05 });
    }
    tl.to(ball, { x: laneX(res.slot, rows), y: slotY(), duration: 0.1, ease: 'power1.in' });
  }

  function settle(slot: number, mult: number) {
    const payout = $bet * mult;
    if (payout > 0) balance.update((b) => b + payout);
    ticker = [{ mult, color: slotColor(mult) }, ...ticker].slice(0, 10);
    if (mult >= 10) {
      sfx.bigWin();
      flash = `${mult}× · ${fmt(payout)}`;
      setTimeout(() => (flash = null), 1200);
    } else {
      sfx.win(mult);
    }
    void recordSpin({
      timestamp: Date.now(),
      gameId: 'plinko',
      betAmount: $bet,
      totalWin: payout,
      winMultiplier: mult,
      isBonusTriggered: false,
      isBonusBuy: false,
      symbolsLanded: {}
    });
  }

  onMount(() => {
    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);
  });
  onDestroy(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    gsap.killTweensOf(balls);
  });
</script>

<div class="board" bind:this={wrap}>
  <canvas bind:this={canvas}></canvas>
  {#if flash}<div class="flash">{flash}</div>{/if}
  {#if ticker.length}
    <div class="ticker">
      {#each ticker as t}
        <span class="chip" style="--c:{t.color}">{t.mult}×</span>
      {/each}
    </div>
  {/if}
</div>

<section class="panel">
  <div class="rowctrl">
    <div class="field-col">
      <span class="lbl">Risk</span>
      <div class="segment">
        {#each RISKS as r}
          <button class:on={risk === r} onclick={() => (risk = r)}>{r}</button>
        {/each}
      </div>
    </div>
    <div class="field-col rows">
      <span class="lbl">Rows</span>
      <div class="rowstep">
        <button class="icon-btn" onclick={() => (rows = Math.max(MIN_ROWS, rows - 1))}>−</button>
        <strong class="tabular">{rows}</strong>
        <button class="icon-btn" onclick={() => (rows = Math.min(MAX_ROWS, rows + 1))}>+</button>
      </div>
    </div>
  </div>

  <div class="controls">
    <BetControl />
    <button class="btn btn-primary drop" onclick={drop}>DROP</button>
  </div>
</section>

<style>
  .board {
    flex: 1;
    min-height: 0;
    position: relative;
    display: grid;
    place-items: center;
    padding: 0.4rem;
  }
  canvas {
    display: block;
    border-radius: var(--radius-lg);
    background: radial-gradient(120% 90% at 50% 0%, #10202b, #07090f 75%);
    border: 1px solid var(--line);
    box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.6), 0 0 0 3px rgba(25, 195, 201, 0.25);
  }
  .flash {
    position: absolute;
    top: 14%;
    left: 0;
    right: 0;
    text-align: center;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.6rem;
    color: #19c3c9;
    text-shadow: 0 0 20px rgba(25, 195, 201, 0.7);
    pointer-events: none;
    animation: pop 0.3s ease;
  }
  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  .ticker {
    position: absolute;
    bottom: 6px;
    left: 6px;
    right: 6px;
    display: flex;
    gap: 0.3rem;
    overflow: hidden;
    justify-content: center;
  }
  .chip {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 0.12rem 0.4rem;
    border-radius: 6px;
    background: color-mix(in srgb, var(--c) 28%, #0b0e16);
    border: 1px solid var(--c);
    color: #fff;
  }

  .panel {
    background: var(--panel-grad);
    border-top: 1px solid var(--line);
    padding: 0.7rem 0.9rem calc(0.9rem + env(safe-area-inset-bottom));
  }
  .rowctrl {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.6rem;
    align-items: end;
    margin-bottom: 0.7rem;
  }
  .field-col {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .lbl {
    font-size: 0.66rem;
    letter-spacing: 0.4px;
    color: var(--muted);
  }
  .rowstep {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--input);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.3rem;
  }
  .rowstep .icon-btn {
    width: 30px;
    height: 30px;
    font-size: 1.05rem;
    border-radius: 6px;
  }
  .rowstep strong {
    min-width: 26px;
    text-align: center;
    font-size: 1.05rem;
  }
  .controls {
    display: grid;
    grid-template-columns: 1fr 42%;
    gap: 0.6rem;
    align-items: end;
  }
  .drop {
    min-height: 52px;
    font-family: var(--font-display);
    font-size: 1.2rem;
    letter-spacing: 2px;
  }
</style>
