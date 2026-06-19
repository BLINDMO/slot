<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import Plinko from '$lib/instant/Plinko.svelte';
  import Keno from '$lib/instant/Keno.svelte';

  const id = page.params.id ?? '';
</script>

{#if id === 'plinko'}
  <Plinko />
{:else if id === 'keno'}
  <Keno />
{:else}
  <div class="empty">
    <p>Game not found.</p>
    <button class="btn" onclick={() => goto(`${base}/`)}>Back to hub</button>
  </div>
{/if}

<style>
  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    justify-content: center;
  }
</style>
