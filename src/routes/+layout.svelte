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
    max-width: 640px;
    margin: 0 auto;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
</style>
