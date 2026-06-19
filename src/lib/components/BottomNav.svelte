<script lang="ts">
  import { base } from '$app/paths';
  let { active = 'casino', onSearch }: { active?: string; onSearch?: () => void } = $props();
</script>

<nav class="bnav">
  <a class="item" class:on={active === 'casino'} href="{base}/" aria-label="Casino">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
    <span>Casino</span>
  </a>
  <button class="item" onclick={() => onSearch?.()} aria-label="Search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" stroke-linecap="round" />
    </svg>
    <span>Search</span>
  </button>
  <a class="item" class:on={active === 'stats'} href="{base}/admin" aria-label="Stats">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" />
    </svg>
    <span>Stats</span>
  </a>
</nav>

<style>
  .bnav {
    flex: none;
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    background: var(--bg-2);
    border-top: 1px solid var(--line);
  }
  .item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.5rem 0;
    color: var(--muted);
    background: none;
    transition: color 0.12s ease;
  }
  .item svg {
    width: 22px;
    height: 22px;
  }
  .item span {
    font-size: 0.62rem;
    font-weight: 600;
  }
  .item.on {
    color: var(--text);
  }
  .item:active {
    color: var(--blue-2);
  }
</style>
