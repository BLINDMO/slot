<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * The single shared layout shell for every screen (hub, slots, instant games).
   * It owns the vertical rhythm so no game implements its own full-height layout:
   *
   *   header   — fixed height, never grows/shrinks
   *   canvas   — fills ALL remaining space (flex:1 + min-height:0 so a large
   *              child like a PixiJS stage shrinks to fit instead of overflowing)
   *   controls — docks to the bottom with iOS home-indicator clearance
   *
   * `scroll` makes the canvas region an internal scroller (used by the hub list);
   * games leave it false so the play area is a fixed, non-scrolling surface.
   */
  let {
    header,
    canvas,
    controls,
    scroll = false
  }: {
    header?: Snippet;
    canvas: Snippet;
    controls?: Snippet;
    scroll?: boolean;
  } = $props();
</script>

<div class="shell">
  {#if header}<div class="gs-header">{@render header()}</div>{/if}
  <div class="gs-canvas" class:scroll>{@render canvas()}</div>
  {#if controls}<div class="gs-controls">{@render controls()}</div>{/if}
</div>

<style>
  .shell {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .gs-header {
    flex: 0 0 auto;
    padding-top: env(safe-area-inset-top);
  }
  .gs-canvas {
    flex: 1 1 auto;
    min-height: 0;
    position: relative;
    overflow: hidden;
  }
  .gs-canvas.scroll {
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
  .gs-controls {
    flex: 0 0 auto;
    padding-bottom: env(safe-area-inset-bottom);
  }
</style>
