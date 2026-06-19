# Slot Hub

A single-player **slot machine hub** PWA: one installable app containing a roster
of original slot machines. **Virtual credits only** — no real-money wagering, no
cash-out, no accounts, no backend. Balance, stats and history persist locally
on-device (IndexedDB).

> Priority order, per the brief: **mechanics > feel > graphics.** Every game has a
> mechanically distinct core feature. Art is intentionally placeholder
> (programmatic) at this stage; the architecture is the point.

## Architecture — the math / presentation split

This follows the Stake `math-sdk` / `web-sdk` pattern: a **math layer** decoupled
from a **presentation layer**, connected by a stream of **book events**.

```
src/lib/
  engine/          # pure, framework-free slot math
    rng.ts         #   seedable RNG (mulberry32) — reproducible sims
    types.ts       #   Book / BookEvent / Game contract
    board.ts       #   weighted fills, cluster flood-fill, tumble gravity
    cluster.ts     #   cluster-pays evaluation
    paylines.ts    #   left-to-right payline evaluation
  games/           # one folder per game: config (reels/paytable) + spin logic
    blackwaterBay/ #   cluster pays + tumble + free-spin multiplier trail
    luckySevens/   #   3x3 paylines + double-or-nothing gamble
  sim/simulate.ts  # Monte Carlo RTP/volatility/hit-freq aggregator
  render/          # presentation layer (knows no rules)
    SlotRenderer.ts#   generic PixiJS board renderer (any cols x rows)
    player.ts      #   replays a Book event-by-event with animation/audio
  store/           # IndexedDB persistence + Svelte stores
  audio.ts         # Web Audio placeholder SFX (Howler swap point)
```

A game's `spin(rng, options)` is **pure**: given an RNG and a bet it returns a
`Book` — an ordered list of every event in the spin (reveal, wins, tumbles,
multiplier changes, free-spin triggers, final win). Nothing in the math layer
touches the DOM, PixiJS or audio.

Because outcomes are fully determined by the math layer:

- the **simulator** calls `spin()` millions of times to measure real RTP,
- the **renderer** just plays a `Book` back — adding a game means adding config +
  a `spin()`, not new rendering work,
- the **admin dashboard** gets accurate per-spin telemetry for free.

## Validated math (Monte Carlo)

Run before shipping any game's config. RTP scales linearly with the paytable, so
the workflow is: shape hit-frequency & bonus-rate with reel weights, then scale
the whole paytable to hit target RTP.

```bash
npm run sim blackwaterBay 5000000
npm run sim luckySevens 3000000
npm run sim blackwaterBay 1000000 --buy   # bonus-buy RTP
```

Current measured results (2M+ spins):

| Game           | Target RTP | **Measured RTP** | Hit freq | Bonus freq | Volatility (sigma) |
| -------------- | ---------- | ---------------- | -------- | ---------- | ------------------ |
| Blackwater Bay | 96.5%      | **96.50%**       | 25.6%    | ~1 in 196  | 4.74 (High)        |
| Lucky Sevens   | 96.0%      | **95.95%**       | 47.0%    | n/a        | 2.19 (Medium)      |

`npm run sim` exits non-zero if measured RTP drifts >1pp from target, so it can
gate CI.

## Roster

| #   | Game              | Mechanic                                           | Status      |
| --- | ----------------- | -------------------------------------------------- | ----------- |
| 1   | Blackwater Bay    | Cluster pays + tumble + free-spin multiplier trail | Playable    |
| 2   | Vaultbreakers     | Hold & Win money respins, 4-tier jackpot           | Roadmap     |
| 3   | High Noon         | VS duel -> escalating sticky-wild free spins       | Roadmap     |
| 4   | Forge of Valhalla | Megaways-style ways + multiplier upgrades          | Roadmap     |
| 5   | Lucky Sevens      | 3x3 paylines + gamble wheel                         | Playable    |
| 6   | Nova Drift        | Pick-and-click prize grid                          | Roadmap     |

The four roadmap games are registered (so the hub & dashboard list them) but
their math is not yet implemented — they appear as "coming soon" tiles. Adding
one is: a `config.ts` (reels/paytable), a `spin()` producing book events, a skin,
and an RTP sim pass.

## Admin dashboard (`/admin`)

PIN-gated (local only — not real auth). Reads from the never-capped aggregates
that every resolved spin folds into (the detailed spin log is capped at 5,000
records and rotated; aggregates survive rotation). Shows: live RTP vs target per
game, biggest-wins leaderboard, hit frequency, win-size histogram, hold %, bonus
natural-vs-buy rate, and per-symbol payout contribution.

## Dev

```bash
npm install
npm run dev      # local dev server
npm run check    # svelte-check (types)
npm test         # engine smoke tests
npm run build    # static SPA build into build/ (PWA: manifest + service worker)
```

### Stack

SvelteKit (SPA, `adapter-static`) · PixiJS 8 · GSAP · IndexedDB (`idb-keyval`) ·
`@vite-pwa/sveltekit` (Workbox). iOS PWA notes: standalone display, safe-area
insets, manual Add-to-Home-Screen onboarding (`InstallPrompt.svelte`), Web Audio
unlocked on first tap.

## What's intentionally not done yet

- Games 2/3/4/6 math (roadmap).
- Real art & audio (Section 7 asset pass) — current visuals are programmatic
  placeholders; `skins.ts`, `audio.ts` and the renderer are the swap points.
- Lazy per-game asset bundles, offline precache tuning, real-device iOS pass.
