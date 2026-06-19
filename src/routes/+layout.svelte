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
    max-width: 480px;
    margin: 0 auto;
    /* Exactly the viewport: game screens fit with no page scroll; the hub (taller
       content) scrolls inside this one container. */
    height: 100dvh;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }
</style>
