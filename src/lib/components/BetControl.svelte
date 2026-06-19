<script lang="ts">
  import { bet, balance } from '$store/state';

  let { disabled = false, compact = false }: { disabled?: boolean; compact?: boolean } = $props();

  const MIN = 1;

  function commit(v: number) {
    if (!Number.isFinite(v)) return;
    const max = Math.max(MIN, Math.floor($balance));
    bet.set(Math.min(Math.max(MIN, Math.round(v)), Math.max(max, MIN)));
  }
  function onInput(e: Event) {
    commit(Number((e.currentTarget as HTMLInputElement).value));
  }
  const half = () => commit(Math.floor($bet / 2));
  const double = () => commit($bet * 2);
</script>

<div class="bet" class:compact>
  {#if !compact}<span class="label">Bet Amount</span>{/if}
  <div class="field">
    <span class="coin" aria-hidden="true"></span>
    <input
      class="amt tabular"
      type="number"
      inputmode="numeric"
      min={MIN}
      value={$bet}
      oninput={onInput}
      {disabled}
      aria-label="Bet amount"
    />
    <div class="mult">
      <button onclick={half} {disabled}>½</button>
      <button onclick={double} {disabled}>2×</button>
    </div>
  </div>
</div>

<style>
  .bet {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }
  .label {
    font-size: 0.66rem;
    letter-spacing: 0.4px;
    color: var(--muted);
  }
  .field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--input);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.45rem 0.55rem;
  }
  .field:focus-within {
    border-color: var(--accent);
  }
  .coin {
    flex: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #ffe39a, #d9a441 70%, #a9781f 100%);
    box-shadow: inset 0 0 0 1.5px rgba(0, 0, 0, 0.2);
  }
  .amt {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    color: var(--text);
    font-size: 1.05rem;
    font-weight: 600;
    padding: 0;
  }
  .amt:focus {
    outline: none;
  }
  /* Hide number spinners */
  .amt::-webkit-outer-spin-button,
  .amt::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .amt {
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .mult {
    display: flex;
    gap: 4px;
    flex: none;
  }
  .mult button {
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 6px;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.28rem 0.55rem;
    transition: filter 0.12s ease, color 0.12s ease;
  }
  .mult button:hover {
    color: var(--text);
    filter: brightness(1.15);
  }
  .mult button:active {
    transform: scale(0.94);
  }
</style>
