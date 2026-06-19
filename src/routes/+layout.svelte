<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initState } from '$store/state';

  let { children } = $props();

  onMount(() => {
    void initState();
  });
</script>

<main>
  {@render children()}
</main>

<style>
  main {
    /* The ONE full-height container — 100% of the locked body. Every page fills
       it; there is no other element claiming viewport height anywhere. */
    position: relative;
    height: 100%;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
