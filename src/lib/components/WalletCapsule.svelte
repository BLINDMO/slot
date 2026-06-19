<script lang="ts">
  import { balance } from '$store/state';
  import { base } from '$app/paths';

  let { compact = false }: { compact?: boolean } = $props();
  const fmt = (n: number) =>
    Math.round(n).toLocaleString(undefined, { minimumFractionDigits: 0 });
</script>

<div class="cap" class:compact>
  <div class="bal">
    <span class="coin" aria-hidden="true"></span>
    <strong class="tabular">{fmt($balance)}</strong>
    {#if !compact}<span class="caret">▾</span>{/if}
  </div>
  {#if !compact}
    <a class="wbtn" href="{base}/admin" aria-label="Wallet">Wallet</a>
  {/if}
</div>

<style>
  .cap {
    display: inline-flex;
    align-items: stretch;
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-2);
    box-shadow: inset 0 0 0 1px var(--line);
  }
  .bal {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.42rem 0.6rem;
  }
  .coin {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #ffe39a, var(--gold) 65%, #b8860b 100%);
    box-shadow: inset 0 0 0 1.5px rgba(0, 0, 0, 0.25);
  }
  .bal strong {
    font-size: 0.92rem;
    font-weight: 600;
  }
  .caret {
    color: var(--muted);
    font-size: 0.7rem;
    margin-left: 0.1rem;
  }
  .wbtn {
    display: inline-flex;
    align-items: center;
    background: var(--primary);
    color: #002600;
    font-weight: 700;
    font-size: 0.82rem;
    padding: 0 0.8rem;
  }
  .wbtn:hover {
    background: var(--primary-700);
  }
  .compact {
    border-radius: 999px;
  }
  .compact .bal {
    padding: 0.4rem 0.7rem;
  }
</style>
