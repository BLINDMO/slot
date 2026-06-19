<script lang="ts">
  import { balance } from '$store/state';
  const fmt = (n: number) => Math.round(n).toLocaleString();
</script>

<div class="wallet" title="Balance (virtual credits)">
  <span class="coin" aria-hidden="true"></span>
  <strong class="tabular">{fmt($balance)}</strong>
</div>

<style>
  .wallet {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    background: var(--input);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.4rem 0.75rem;
  }
  .coin {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #ffe39a, #d9a441 70%, #a9781f 100%);
    box-shadow: inset 0 0 0 1.5px rgba(0, 0, 0, 0.2);
  }
  strong {
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.2px;
  }
</style>
