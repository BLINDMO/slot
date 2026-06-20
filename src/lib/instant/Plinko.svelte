<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { balance, bet } from '$store/state';
  import { recordSpin } from '$store/db';
  import BetControl from '$lib/components/BetControl.svelte';
  import GameShell from '$lib/components/GameShell.svelte';
  import GameHeader from '$lib/components/GameHeader.svelte';
  import WinPopup from '$lib/components/WinPopup.svelte';
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
  let canvasEl = $state<HTMLCanvasElement>();
  let wrap = $state<HTMLDivElement>();
  let flash = $state<string | null>(null);

  const multipliers = $derived(plinkoMultipliers(rows, risk));
  let ticker = $state<{ mult: number; color: string }[]>([]);
  let winPopup = $state<{ amount: number; label: string; accent: string } | null>(null);

  /**
   * A physically-simulated ball. It free-falls under gravity, pops off each peg
   * with an upward bounce, then arcs to the next peg. The horizontal speed of
   * each hop is solved so the ball lands exactly on the math-chosen peg/slot, so
   * the motion is real physics yet the outcome stays RTP-accurate.
   */
  type Ball = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number; // next peg row to reach (1..rows), then rows+1 = dropping into bin
    tx: number; // current hop target x
    ty: number; // current hop target y
    path: number[]; // res.lane
    slot: number;
    mult: number;
    squash: number; // 0..1 impact deformation, decays each frame
    color: string;
    edge: string;
    settled: boolean;
    rest: number; // frames to keep showing after settling
    trail: { x: number; y: number }[];
  };
  const balls: Ball[] = [];
  const pegFlash = new Map<string, number>(); // "r:i" -> 0..1
  const ripples: { x: number; y: number; t: number }[] = [];
  const slotPop = new Map<number, number>(); // slot index -> 0..1 landing bounce

  let W = 360;
  let H = 420;
  let dpr = 1;
  let raf = 0;

  // --- geometry -----------------------------------------------------------
  const topY = () => 26;
  const slotY = () => H - 30;
  const rowGap = () => (slotY() - topY() - 14) / (rows + 1);
  const step = () => W / (rows + 2);
  function laneX(v: number, r: number): number {
    return W / 2 + (v - r / 2) * step();
  }
  const pegY = (r: number) => topY() + r * rowGap();
  const ballRadius = () => Math.max(4.5, step() * 0.22);

  // --- colours ------------------------------------------------------------
  function lerpColor(a: number[], b: number[], t: number): string {
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  function slotColor(mult: number): string {
    const max = Math.max(...multipliers);
    const t = Math.min(1, Math.log(mult + 0.0001) / Math.log(max + 0.0001));
    // teal -> yellow -> orange -> pink, matching the Stake-style risk gradient
    if (t < 0.5) return lerpColor([34, 157, 143], [233, 196, 106], t / 0.5);
    if (t < 0.8) return lerpColor([233, 196, 106], [231, 111, 81], (t - 0.5) / 0.3);
    return lerpColor([231, 111, 81], [255, 61, 129], (t - 0.8) / 0.2);
  }

  function resize() {
    if (!wrap || !canvasEl) return;
    W = wrap.clientWidth;
    H = wrap.clientHeight;
    if (W < 10 || H < 10) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasEl.width = W * dpr;
    canvasEl.height = H * dpr;
    canvasEl.style.width = `${W}px`;
    canvasEl.style.height = `${H}px`;
  }

  // --- physics ------------------------------------------------------------
  // Tuned so each peg-to-peg hop reads as a believable bounce. Gravity and the
  // upward pop both scale with the board so it feels identical at any row count.
  const gravity = () => rowGap() * 0.062;
  const popUp = () => rowGap() * 0.2;

  /** Aim a ball at its next peg (or the final bin), solving vx so it arrives there. */
  function aim(b: Ball) {
    let tx: number;
    let ty: number;
    if (b.r <= rows) {
      tx = laneX(b.path[b.r], b.r);
      ty = pegY(b.r);
    } else {
      tx = laneX(b.slot, rows);
      ty = slotY() - ballRadius() - 1;
    }
    b.tx = tx;
    b.ty = ty;
    const g = gravity();
    const dy = Math.max(1, ty - b.y);
    // First drop from the funnel has no upward pop; every peg bounce does.
    const vy0 = b.r <= 1 ? 0 : -popUp();
    const T = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * g * dy)) / g;
    b.vx = (tx - b.x) / T;
    b.vy = vy0;
  }

  function stepBall(b: Ball) {
    if (b.settled) {
      b.rest -= 1;
      return;
    }
    const g = gravity();
    b.vy += g;
    b.x += b.vx;
    b.y += b.vy;
    b.squash *= 0.82;

    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 7) b.trail.shift();

    // Arrived at the hop target (moving downward through it).
    if (b.vy > 0 && b.y >= b.ty) {
      b.x = b.tx;
      b.y = b.ty;
      const impactSpeed = Math.min(1, Math.abs(b.vy) / (popUp() + g * 8));
      if (b.r <= rows) {
        // Peg bounce: squash, ripple, light up the peg, tick a sound.
        b.squash = 0.55 + impactSpeed * 0.45;
        const col = b.path[b.r];
        pegFlash.set(`${b.r}:${col}`, 1);
        ripples.push({ x: b.tx, y: b.ty, t: 0 });
        if (b.r % 2 === 0) sfx.reelStop();
        b.r += 1;
        aim(b);
      } else {
        // Landed in the bin.
        b.squash = 0.9;
        b.settled = true;
        b.rest = 22;
        settle(b.slot, b.mult);
      }
    }
  }

  function draw() {
    const ctx = canvasEl?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const pegR = Math.max(2.2, step() * 0.085);

    // expanding rings where balls struck pegs
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.t += 0.08;
      if (rp.t >= 1) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, pegR + rp.t * pegR * 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(150,225,255,${(1 - rp.t) * 0.45})`;
      ctx.lineWidth = 2 * (1 - rp.t);
      ctx.stroke();
    }

    // pegs
    for (let r = 1; r <= rows; r++) {
      for (let i = 0; i <= r; i++) {
        const x = laneX(i, r);
        const y = pegY(r);
        const f = pegFlash.get(`${r}:${i}`) ?? 0;
        if (f > 0) {
          ctx.beginPath();
          ctx.arc(x, y, pegR + f * 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(150,225,255,${f * 0.4})`;
          ctx.fill();
          pegFlash.set(`${r}:${i}`, Math.max(0, f - 0.06));
        }
        ctx.beginPath();
        ctx.arc(x, y, pegR + f * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = f > 0 ? `rgba(255,255,255,${0.75 + f * 0.25})` : 'rgba(190,205,235,0.55)';
        ctx.fill();
      }
    }

    // slots (with landing pop)
    const sw = step() * 0.92;
    for (let k = 0; k <= rows; k++) {
      let pop = slotPop.get(k) ?? 0;
      if (pop > 0) {
        pop = Math.max(0, pop - 0.06);
        if (pop <= 0) slotPop.delete(k);
        else slotPop.set(k, pop);
      }
      const lift = Math.sin(pop * Math.PI) * 7;
      const h = 24 + Math.sin(pop * Math.PI) * 6;
      const x = laneX(k, rows) - sw / 2;
      const y = slotY() - 10 - lift;
      const col = slotColor(multipliers[k]);
      // pill with a soft top sheen
      ctx.fillStyle = col;
      if (pop > 0) {
        ctx.shadowColor = col;
        ctx.shadowBlur = 20 * pop;
      }
      roundRect(ctx, x, y, sw, h, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      roundRect(ctx, x + 1.5, y + 1.5, sw - 3, h * 0.42, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.font = `800 ${Math.min(11, sw * 0.34)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = multipliers[k] >= 100 ? `${multipliers[k]}` : `${multipliers[k]}x`;
      ctx.fillText(label, x + sw / 2, y + h / 2);
    }

    // balls: physics step + glossy 3D render
    const ballR = ballRadius();
    for (let bi = balls.length - 1; bi >= 0; bi--) {
      const b = balls[bi];
      stepBall(b);
      if (b.settled && b.rest <= 0) {
        balls.splice(bi, 1);
        continue;
      }

      // motion trail
      for (let i = 0; i < b.trail.length; i++) {
        const a = (i / b.trail.length) * 0.28;
        ctx.beginPath();
        ctx.arc(b.trail[i].x, b.trail[i].y, ballR * (0.35 + (i / b.trail.length) * 0.45), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,210,120,${a})`;
        ctx.fill();
      }

      // squash & velocity stretch → sells weight and impact
      const sq = b.squash;
      const stretch = Math.min(0.35, Math.abs(b.vy) * 0.01);
      const sx = 1 + sq * 0.4 - stretch * 0.5;
      const sy = 1 - sq * 0.32 + stretch;

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(sx, sy);

      // glow
      ctx.beginPath();
      ctx.arc(0, 0, ballR * 1.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,190,90,0.18)';
      ctx.fill();

      // spherical body
      const grad = ctx.createRadialGradient(-ballR * 0.35, -ballR * 0.4, ballR * 0.1, 0, 0, ballR);
      grad.addColorStop(0, '#fff6df');
      grad.addColorStop(0.45, b.color);
      grad.addColorStop(1, b.edge);
      ctx.beginPath();
      ctx.arc(0, 0, ballR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // specular highlight
      ctx.beginPath();
      ctx.arc(-ballR * 0.32, -ballR * 0.36, ballR * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();
      ctx.restore();
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
    const ball: Ball = {
      x: W / 2,
      y: topY() - ballRadius() * 1.5,
      vx: 0,
      vy: 0,
      r: 1,
      tx: W / 2,
      ty: pegY(1),
      path: res.lane,
      slot: res.slot,
      mult: res.multiplier,
      squash: 0,
      color: '#ffcf5a',
      edge: '#b8791e',
      settled: false,
      rest: 0,
      trail: []
    };
    aim(ball);
    balls.push(ball);
  }

  function settle(slot: number, mult: number) {
    slotPop.set(slot, 1);
    const payout = $bet * mult;
    if (payout > 0) balance.update((b) => b + payout);
    ticker = [{ mult, color: slotColor(mult) }, ...ticker].slice(0, 10);
    if (mult >= 10) {
      sfx.bigWin();
      const label = mult >= 100 ? 'MEGA WIN' : 'BIG WIN';
      winPopup = { amount: payout, label, accent: mult >= 100 ? '#f1c232' : '#19c3c9' };
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

  let ro: ResizeObserver | null = null;
  onMount(() => {
    resize();
    ro = new ResizeObserver(() => resize());
    if (wrap) ro.observe(wrap);
    raf = requestAnimationFrame(draw);
  });
  onDestroy(() => {
    cancelAnimationFrame(raf);
    ro?.disconnect();
  });
</script>

<GameShell>
  {#snippet header()}
    <GameHeader title="Plinko" />
  {/snippet}

  {#snippet canvas()}
    <div class="board" bind:this={wrap}>
      <canvas bind:this={canvasEl}></canvas>
      {#if flash}<div class="flash">{flash}</div>{/if}
      {#if ticker.length}
        <div class="ticker">
          {#each ticker as t}
            <span class="chip" style="--c:{t.color}">{t.mult}×</span>
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}

  {#snippet controls()}
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
  {/snippet}
</GameShell>

{#if winPopup}
  <WinPopup amount={winPopup.amount} label={winPopup.label} accent={winPopup.accent} onClose={() => (winPopup = null)} />
{/if}

<style>
  .board {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: radial-gradient(125% 90% at 50% 0%, #141a2e, #0a0c16 78%);
  }
  canvas {
    display: block;
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
    flex: none;
    background: var(--panel-grad);
    border-top: 1px solid var(--line);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 0.6rem 0.7rem;
  }
  .rowctrl {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.6rem;
    align-items: end;
    margin-bottom: 0.55rem;
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
