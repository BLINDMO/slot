<script lang="ts">
  import { balance } from '$store/state';
  import { base } from '$app/paths';

  let { compact = false }: { compact?: boolean } = $props();
  // Two-decimal display reads like a real sweeps balance (e.g. 8,888.00).
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<div class="cap" class:compact>
  <div class="bal">
    <span class="coin" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="url(#gc)" stroke="#7a5a12" stroke-width="1.2" />
        <circle cx="12" cy="12" r="6.4" fill="none" stroke="#a9810f" stroke-width="1.1" opacity="0.7" />
        <path d="M12 8.2v7.6M9.7 9.6h3.1a1.6 1.6 0 010 3.2H9.9h2.9a1.6 1.6 0 010 3.2H9.7"
          stroke="#6b4e0c" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <defs>
          <radialGradient id="gc" cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stop-color="#ffe9a8" />
            <stop offset="0.6" stop-color="#ffce4a" />
            <stop offset="1" stop-color="#d99518" />
          </radialGradient>
        </defs>
      </svg>
    </span>
    <strong class="tabular">{fmt($balance)}</strong>
    <span class="caret" aria-hidden="true">▾</span>
  </div>
  <a class="wbtn" href="{base}/admin" aria-label="Wallet">
    {#if !compact}<span class="wtxt">Wallet</span>{/if}
    <svg viewBox="0 0 24 24" fill="none" stroke="#003314" stroke-width="2.4" stroke-linecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  </a>
</div>

<style>
  .cap {
    display: inline-flex;
    align-items: stretch;
    border-radius: 10px;
    overflow: hidden;
    background: #11121b;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);
  }
  .bal {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.4rem 0.55rem 0.4rem 0.5rem;
  }
  .coin {
    width: 17px;
    height: 17px;
    display: block;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  }
  .coin svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .bal strong {
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
  .caret {
    color: var(--muted);
    font-size: 0.62rem;
    margin-left: 0.05rem;
  }
  .wbtn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: linear-gradient(180deg, #38ff9a, #16d977);
    color: #003314;
    font-weight: 800;
    font-size: 0.82rem;
    padding: 0 0.7rem;
  }
  .wbtn svg {
    width: 14px;
    height: 14px;
  }
  .wbtn:active {
    filter: brightness(0.94);
  }

  /* Compact (in-game header): pill shape, icon-only wallet button. */
  .compact {
    border-radius: 999px;
  }
  .compact .bal {
    padding: 0.36rem 0.55rem;
  }
  .compact .wbtn {
    padding: 0 0.6rem;
  }
</style>
