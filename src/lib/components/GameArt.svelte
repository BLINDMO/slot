<script lang="ts">
  // Vector motifs per game — replaces the emoji placeholders. Stroke uses
  // currentColor (set by the card to white) over the game's coloured thumbnail.
  let { id, size = 56 }: { id: string; size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#if id === 'blackwaterBay'}
    <!-- ship's wheel -->
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="8.2" />
    {#each [0, 45, 90, 135, 180, 225, 270, 315] as a}
      <line
        x1={12 + 3 * Math.cos((a * Math.PI) / 180)}
        y1={12 + 3 * Math.sin((a * Math.PI) / 180)}
        x2={12 + 10.5 * Math.cos((a * Math.PI) / 180)}
        y2={12 + 10.5 * Math.sin((a * Math.PI) / 180)}
      />
    {/each}
  {:else if id === 'vaultbreakers'}
    <!-- vault door -->
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    <line x1="12" y1="3.5" x2="12" y2="20.5" opacity="0" />
    {#each [0, 60, 120, 180, 240, 300] as a}
      <line
        x1={12 + 5 * Math.cos((a * Math.PI) / 180)}
        y1={12 + 5 * Math.sin((a * Math.PI) / 180)}
        x2={12 + 7.3 * Math.cos((a * Math.PI) / 180)}
        y2={12 + 7.3 * Math.sin((a * Math.PI) / 180)}
      />
    {/each}
  {:else if id === 'highNoon'}
    <!-- sheriff star -->
    <path d="M12 2.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L12 15.8 6 18.52l.99-5.8-4.21-4.1 5.82-.85z" />
    <circle cx="12" cy="11.5" r="1.4" fill="currentColor" />
  {:else if id === 'forgeOfValhalla'}
    <!-- hammer (mjölnir) -->
    <rect x="5" y="4" width="14" height="7" rx="1.5" />
    <line x1="12" y1="11" x2="12" y2="21" />
    <line x1="9" y1="21" x2="15" y2="21" />
  {:else if id === 'luckySevens'}
    <!-- stylised 7 -->
    <path d="M7 6h10l-5 13" />
    <line x1="9.5" y1="12" x2="14" y2="12" />
  {:else if id === 'novaDrift'}
    <!-- ringed planet -->
    <circle cx="11" cy="11" r="6" />
    <ellipse cx="11" cy="11" rx="11" ry="3.4" transform="rotate(-25 11 11)" />
  {:else if id === 'plinko'}
    <!-- peg triangle + ball -->
    <circle cx="12" cy="4.5" r="1.4" fill="currentColor" />
    {#each [[8.5, 10], [15.5, 10], [5, 15.5], [12, 15.5], [19, 15.5]] as [x, y]}
      <circle cx={x} cy={y} r="1.2" />
    {/each}
    <circle cx="12" cy="20" r="1.6" fill="currentColor" />
  {:else if id === 'keno'}
    <!-- target -->
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  {:else}
    <circle cx="12" cy="12" r="8" />
  {/if}
</svg>
