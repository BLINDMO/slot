<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { getInstantMeta } from '$lib/instant/registry';
  import Plinko from '$lib/instant/Plinko.svelte';
  import Keno from '$lib/instant/Keno.svelte';
  import BalanceChip from '$lib/components/BalanceChip.svelte';

  const id = page.params.id ?? '';
  const meta = getInstantMeta(id);
</script>

<header class="topbar">
  <button class="icon-btn" onclick={() => goto(`${base}/`)} aria-label="Back to hub">‹</button>
  <div class="title">{meta?.title ?? 'Unknown game'}</div>
  <BalanceChip />
</header>

{#if !meta}
  <div class="empty">
    <p>Game not found.</p>
    <button class="btn" onclick={() => goto(`${base}/`)}>Back to hub</button>
  </div>
{:else if id === 'plinko'}
  <Plinko />
{:else if id === 'keno'}
  <Keno />
{/if}

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.8rem;
  }
  .title {
    flex: 1;
    text-align: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.5px;
  }
  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    justify-content: center;
  }
</style>
