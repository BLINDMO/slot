<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { GAMES } from '$games/index';
  import { INSTANT_GAMES } from '$lib/instant/registry';
  import { settings } from '$store/state';

  // Slots + instant games share the same telemetry; list both here.
  const allMeta = [...GAMES.map((g) => g.meta), ...INSTANT_GAMES].filter((m) => m.playable);
  const titleFor = (id: string) => allMeta.find((m) => m.id === id)?.title ?? id;
  import {
    loadAggregates,
    bucketLabels,
    resetAll,
    type Aggregates,
    type GameAgg
  } from '$store/db';

  let unlocked = $state(false);
  let pinInput = $state('');
  let agg = $state<Aggregates | null>(null);
  let pinError = $state('');
  const labels = bucketLabels();

  const needsSetup = $derived($settings.adminPin === null);

  onMount(async () => {
    agg = await loadAggregates();
  });

  function submitPin() {
    if (needsSetup) {
      if (pinInput.length < 4) {
        pinError = 'Choose at least 4 digits';
        return;
      }
      settings.update((s) => ({ ...s, adminPin: pinInput }));
      unlocked = true;
    } else if (pinInput === $settings.adminPin) {
      unlocked = true;
    } else {
      pinError = 'Incorrect PIN';
    }
    pinInput = '';
  }

  async function hardReset() {
    if (!confirm('Reset balance and ALL stats? This cannot be undone.')) return;
    await resetAll();
    agg = await loadAggregates();
  }

  const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
  const fmt = (n: number) => Math.round(n).toLocaleString();

  // Overall roll-up across all games.
  const overall = $derived.by(() => {
    const games = agg ? Object.values(agg.perGame) : [];
    const sum = (f: (g: GameAgg) => number) => games.reduce((a, g) => a + f(g), 0);
    const wagered = sum((g) => g.wagered);
    const paid = sum((g) => g.paid);
    return {
      spins: sum((g) => g.spins),
      wagered,
      paid,
      hold: wagered ? (wagered - paid) / wagered : 0,
      rtp: wagered ? paid / wagered : 0
    };
  });

  let leaderboardFilter = $state('all');
  const leaderboard = $derived(
    (agg?.bigWins ?? [])
      .filter((w) => leaderboardFilter === 'all' || w.gameId === leaderboardFilter)
      .slice(0, 15)
  );

  function topSymbols(g: GameAgg): [string, number][] {
    const total = Object.values(g.symbolWins).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(g.symbolWins)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s, v]) => [s, v / total]);
  }
  function maxBucket(g: GameAgg): number {
    return Math.max(1, ...g.buckets);
  }
</script>

<header class="bar">
  <button class="back btn" onclick={() => goto(`${base}/`)} aria-label="Back">‹</button>
  <div class="title">Admin · Game Performance</div>
</header>

{#if !unlocked}
  <div class="gate">
    <h2>{needsSetup ? 'Set an admin PIN' : 'Enter admin PIN'}</h2>
    <p class="muted small">
      Local-only gate to keep stats out of the way of normal play. Not real security — there is no
      server or account.
    </p>
    <input
      class="pin"
      type="password"
      inputmode="numeric"
      bind:value={pinInput}
      placeholder="••••"
      onkeydown={(e) => e.key === 'Enter' && submitPin()}
    />
    {#if pinError}<span class="err">{pinError}</span>{/if}
    <button class="btn btn-primary" onclick={submitPin}>{needsSetup ? 'Set PIN' : 'Unlock'}</button>
  </div>
{:else if agg}
  <section class="cards">
    <div class="stat"><span class="muted">Total spins</span><strong>{fmt(overall.spins)}</strong></div>
    <div class="stat"><span class="muted">Wagered</span><strong>{fmt(overall.wagered)}</strong></div>
    <div class="stat"><span class="muted">Paid out</span><strong>{fmt(overall.paid)}</strong></div>
    <div class="stat">
      <span class="muted">Hold</span><strong class:good={overall.hold >= 0} class:bad={overall.hold < 0}
        >{pct(overall.hold)}</strong
      >
    </div>
    <div class="stat"><span class="muted">Live RTP</span><strong>{pct(overall.rtp)}</strong></div>
    <div class="stat"><span class="muted">Sessions</span><strong>{fmt(agg.sessions)}</strong></div>
  </section>

  <h3>Biggest wins</h3>
  <div class="filter">
    <button class="chip" class:on={leaderboardFilter === 'all'} onclick={() => (leaderboardFilter = 'all')}
      >All</button
    >
    {#each allMeta as m}
      <button class="chip" class:on={leaderboardFilter === m.id} onclick={() => (leaderboardFilter = m.id)}
        >{m.title}</button
      >
    {/each}
  </div>
  {#if leaderboard.length === 0}
    <p class="muted small empty">No wins recorded yet — go play a few spins.</p>
  {:else}
    <ol class="board">
      {#each leaderboard as w}
        <li>
          <span class="lb-mult">{w.multiplier.toFixed(1)}×</span>
          <span class="lb-game">{titleFor(w.gameId)}</span>
          <span class="lb-amt tabular">{fmt(w.amount)} cr</span>
        </li>
      {/each}
    </ol>
  {/if}

  <h3>Per-game performance</h3>
  {#each allMeta as m}
    {@const ga = agg.perGame[m.id]}
    <div class="game" style="--c:{m.color}">
      <div class="ghead">
        <strong>{m.title}</strong>
        <span class="muted small">{ga ? fmt(ga.spins) : 0} spins</span>
      </div>
      {#if !ga || ga.spins === 0}
        <p class="muted small">No data yet.</p>
      {:else}
        {@const liveRtp = ga.wagered ? ga.paid / ga.wagered : 0}
        {@const liveHit = ga.spins ? ga.hits / ga.spins : 0}
        <div class="metrics">
          <div>
            <span class="muted small">Live RTP</span>
            <div><strong>{pct(liveRtp)}</strong> <span class="muted small">/ {pct(m.targetRtp)}</span></div>
          </div>
          <div>
            <span class="muted small">Hit freq</span>
            <div>
              <strong>{pct(liveHit)}</strong> <span class="muted small">/ {pct(m.targetHitFreq)}</span>
            </div>
          </div>
          <div>
            <span class="muted small">Bonus (nat/buy)</span>
            <div><strong>{ga.bonusNatural}</strong> / {ga.bonusBuy}</div>
          </div>
        </div>

        <div class="hist">
          {#each ga.buckets as count, i}
            <div class="hbar" title="{labels[i]}: {count}">
              <div class="hfill" style="height:{(count / maxBucket(ga)) * 100}%"></div>
            </div>
          {/each}
        </div>
        <div class="hlabels">
          <span>loss</span><span>small</span><span>big</span>
        </div>

        <div class="symbols">
          {#each topSymbols(ga) as [sym, share]}
            <span class="sym">{sym} <strong>{pct(share)}</strong></span>
          {/each}
        </div>
      {/if}
    </div>
  {/each}

  <div class="danger">
    <button class="btn" onclick={hardReset}>Reset balance & stats</button>
  </div>
{/if}

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.8rem 1rem;
  }
  .back {
    font-size: 1.4rem;
    padding: 0.3rem 0.8rem;
    border-radius: 10px;
  }
  .title {
    font-weight: 700;
  }
  .gate {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    align-items: center;
    padding: 3rem 1.5rem;
    text-align: center;
  }
  .pin {
    font-size: 1.6rem;
    text-align: center;
    letter-spacing: 0.4rem;
    width: 160px;
    padding: 0.6rem;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--panel);
    color: var(--text);
  }
  .err {
    color: var(--bad);
    font-size: 0.85rem;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
    padding: 0 1rem;
  }
  .stat {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .stat span {
    font-size: 0.62rem;
    letter-spacing: 0.5px;
  }
  .stat strong {
    font-size: 1.05rem;
  }
  .good {
    color: var(--good);
  }
  .bad {
    color: var(--bad);
  }
  h3 {
    padding: 0 1rem;
    margin: 1.4rem 0 0.6rem;
  }
  .filter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0 1rem 0.6rem;
  }
  .chip {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.3rem 0.7rem;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .chip.on {
    border-color: var(--accent);
    color: var(--text);
  }
  .board {
    list-style: none;
    margin: 0;
    padding: 0 1rem;
  }
  .board li {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.6rem;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--line);
  }
  .lb-mult {
    font-weight: 800;
    color: var(--gold);
    min-width: 56px;
  }
  .lb-amt {
    color: var(--good);
  }
  .game {
    margin: 0 1rem 0.8rem;
    background: var(--panel);
    border: 1px solid var(--line);
    border-left: 3px solid var(--c);
    border-radius: 12px;
    padding: 0.8rem;
  }
  .ghead {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.8rem;
  }
  .hist {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 60px;
  }
  .hbar {
    flex: 1;
    background: var(--bg-soft);
    border-radius: 3px 3px 0 0;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }
  .hfill {
    width: 100%;
    background: var(--c);
    min-height: 1px;
  }
  .hlabels {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: var(--muted);
    margin-top: 0.2rem;
  }
  .symbols {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.6rem;
  }
  .sym {
    font-size: 0.72rem;
    background: var(--panel-2);
    border-radius: 6px;
    padding: 0.2rem 0.45rem;
  }
  .small {
    font-size: 0.74rem;
  }
  .empty {
    padding: 0 1rem;
  }
  .danger {
    padding: 1.5rem 1rem 3rem;
    text-align: center;
  }
</style>
