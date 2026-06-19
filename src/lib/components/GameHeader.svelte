<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import WalletCapsule from './WalletCapsule.svelte';

  let { title }: { title: string } = $props();
</script>

<header class="topbar">
  <button class="icon-btn" onclick={() => goto(`${base}/`)} aria-label="Back to hub">‹</button>
  <div class="title">{title}</div>
  <WalletCapsule compact />
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.7rem;
  }
  .title {
    flex: 1;
    text-align: center;
    font-weight: 700;
    font-size: 1rem;
  }
</style>
