<script lang="ts">
  import type { Game } from '$engine/types';
  import { SKINS } from '$lib/skins';

  let { game, onClose }: { game: Game; onClose: () => void } = $props();

  const symbols = $derived(Object.entries(SKINS[game.meta.id] ?? {}));
  const toCss = (n: number) => '#' + n.toString(16).padStart(6, '0');

  function backdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<div
  class="modal-backdrop"
  onclick={backdrop}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  role="button"
  tabindex="-1"
>
  <div class="modal" role="dialog" aria-label="Game info">
    <div class="head">
      <div>
        <h2>{game.meta.title}</h2>
        <p class="muted theme">{game.meta.theme}</p>
      </div>
      <button class="icon-btn" onclick={onClose} aria-label="Close">✕</button>
    </div>

    <p class="mech">{game.meta.mechanic}</p>

    <div class="stats">
      <div class="stat"><span class="muted">Volatility</span><strong>{game.meta.volatility}</strong></div>
      <div class="stat"><span class="muted">RTP</span><strong>{(game.meta.targetRtp * 100).toFixed(1)}%</strong></div>
      <div class="stat"><span class="muted">Max win</span><strong>{game.meta.maxWin.toLocaleString()}×</strong></div>
      <div class="stat">
        <span class="muted">Bonus buy</span>
        <strong>{game.meta.bonusBuyCost ? `${game.meta.bonusBuyCost}×` : '—'}</strong>
      </div>
    </div>

    <h3 class="sec">Symbols</h3>
    <div class="symgrid">
      {#each symbols as [id, skin]}
        <div class="symcard" class:special={skin.special}>
          <div class="symtile" style="--c:{toCss(skin.color)}">
            <span>{skin.glyph}</span>
          </div>
          <span class="symname muted">{id}</span>
        </div>
      {/each}
    </div>

    <p class="foot muted">
      Virtual credits only — no real-money wagering or cash-out. Wins shown as a multiple of your
      bet.
    </p>
  </div>
</div>

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }
  h2 {
    margin: 0;
    font-size: 1.3rem;
  }
  .theme {
    margin: 0.15rem 0 0;
    font-size: 0.8rem;
  }
  .mech {
    margin: 0.9rem 0;
    line-height: 1.45;
    font-size: 0.92rem;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  .stat {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm);
    padding: 0.55rem 0.4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    text-align: center;
  }
  .stat span {
    font-size: 0.6rem;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .stat strong {
    font-size: 0.95rem;
  }
  .sec {
    margin: 1.2rem 0 0.6rem;
    font-size: 0.95rem;
  }
  .symgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
    gap: 0.7rem;
  }
  .symcard {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }
  .symtile {
    width: 54px;
    height: 54px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    font-size: 1.6rem;
    background: linear-gradient(180deg, color-mix(in srgb, var(--c) 80%, white 12%), var(--c));
    box-shadow: inset 0 -3px 8px rgba(0, 0, 0, 0.3), var(--shadow-1);
  }
  .symcard.special .symtile {
    outline: 2px solid #ffe39a;
    outline-offset: -2px;
  }
  .symname {
    font-size: 0.66rem;
  }
  .foot {
    margin-top: 1.2rem;
    font-size: 0.72rem;
    line-height: 1.4;
  }
</style>
