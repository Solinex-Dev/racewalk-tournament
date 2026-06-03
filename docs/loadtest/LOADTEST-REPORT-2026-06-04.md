# Load Test Report — Racewalk Tournament (staging)

**Date:** 2026-06-04
**Target:** `https://racewalk-tournament.vercel.app` (Vercel serverless + staging DB)
**Deployed commit:** `7b6a13d` on `develop`
**Event under test:** `evt-live` — round `rnd-live-final`, **24 athletes** (ONGOING)
**Driver:** pure-Node concurrent driver (`loadtest/run-read.mjs`, `loadtest/run-write.mjs`). Docker/k6 were unavailable on the runner, so a Node driver was used; it models the app's real behaviour — each virtual user polls every **500 ms** (the current `AutoRefresh` interval) via an `RSC` GET, exactly like a browser tab.

---

## TL;DR

- The public leaderboard is **healthy up to ~25 concurrent viewers** (p95 ≈ 390 ms) and **collapses by 50** (p95 ≈ 8 s, then 10–21 s at 100–150).
- Root cause is **proven, not inferred**: under load the database connection pool is exhausted and requests fail with
  `pool timeout: failed to retrieve a connection from pool after 10000ms (… limit=10)`.
- **Critical race-day risk:** at 50 concurrent spectators, official **writes failed 98/101** (lap recording / card confirm). i.e. *with a real crowd watching the live board, judges/loggers can't record the race.*
- The **500 ms polling** added recently multiplies this: 25 viewers already ≈ the server's throughput ceiling (~50 req/s). At the old 5 s interval the same ceiling was ~250 viewers.
- **Biggest single fix:** cache the public leaderboard (1–2 s) so spectator count is decoupled from DB load. Pair with a serverless connection pooler.

The target of **50–100 concurrent users is NOT met today**; with the leaderboard cached it is comfortably reachable.

---

## Read load — public leaderboard polling (500 ms)

Constant concurrency for 30 s per level, `GET /events/evt-live` with `RSC: 1`.

| Concurrent viewers | Throughput (req/s) | p50 | p95 | p99 | max | HTTP errors |
|--------------------:|-------------------:|----:|----:|----:|----:|:-----------:|
| **25** | **47.7** | 243 ms | **389 ms** | 1.0 s | 2.0 s | 0 |
| 50 | 13.6 | 1.9 s | **8.2 s** | 8.6 s | 8.8 s | 0 |
| 100 | 10.8 | 10.1 s | 20.1 s | 21.4 s | 21.4 s | 0 |
| 150 | 14.1 | 10.1 s | 10.5 s | 10.5 s | 10.9 s | 0 |

Note the **inversion**: doubling load from 25→50 *halves* throughput (47.7→13.6 req/s) and inflates p95 ~21×. That is congestion collapse — requests queue behind a saturated resource rather than being served. No HTTP 5xx during reads (they wait, they don't error), so users experience **slowness, not failure** — until it reaches the connection-pool timeout (below).

## Mixed load — spectators reading **+** officials writing

Spectators poll the board; an event-logger posts laps at 4/s and a judge posts cards at 0.5/s, through the gated `/api/loadtest` endpoint (which calls the **real** `recordLapTime` / `issueYellowCard` server actions, auth enforced via a server-minted official cookie).

| Spectators | Reads ok | Read p50 / p95 | Writes ok | Writes failed | Write p50 / p95 | Dominant write error |
|-----------:|:--------:|:--------------:|:---------:|:-------------:|:---------------:|:---------------------|
| **25** | 1474 / 1474 | 244 ms / **397 ms** | **121** | **0** | 785 ms / 1.06 s | — |
| **50** | 154 / 154 | 10.1 s / **21.3 s** | **3** | **98** | 15.4 s / 20.3 s | `pool timeout … limit=10` |

At 25 spectators the system is fine and officials write reliably (~1 s). At 50 spectators the **same writes fail 97% of the time** with:

```
pool timeout: failed to retrieve a connection from pool after 10000ms
    (pool connections: active=0 idle=0 limit=10)
```

---

## Root cause

The leaderboard page (`app/events/[eventId]/page.tsx`) is `export const dynamic = "force-dynamic"` + `revalidate = 0`, so **every poll runs the full nested Prisma query** (`event → rounds → roundAthletes → athlete/affiliation, cards, lapTimes, finishTimes`) with **no caching**.

On Vercel each concurrent request can spin up a serverless function instance, and each instance's Prisma/MariaDB pool is capped at **10 connections**. Under concurrency the pool (and/or the DB's `max_connections`) is exhausted; further queries wait up to Prisma's 10 s `pool_timeout` and then throw. Reads just queue (slow); writes, arriving into the same exhausted pool, **fail outright**.

The recent **500 ms** polling interval is a force-multiplier: every viewer now generates ~2 req/s instead of ~0.2 req/s at the old 5 s, so the DB ceiling is hit at ~10× fewer viewers.

---

## Recommendations (highest impact first)

1. **Cache the public leaderboard.** This is the single biggest win and directly removes the race-day risk.
   - Replace `revalidate = 0` with a short window (e.g. `export const revalidate = 1` or `2`), or wrap the query in `unstable_cache`/React `cache` with a 1–2 s TTL, optionally tag-invalidated on writes.
   - Effect: N spectators share ~1 query/s instead of N×2 queries/s. The board can then serve thousands of viewers, and the connection pool stays free for officials. A 1–2 s staleness on a scoreboard is unnoticeable.
   - Keep the **officials' workspaces uncached** (they need realtime and are few users).

2. **Use a serverless-safe DB pooler.** `limit=10` per instance × many instances overruns the DB. Don't just raise the per-instance limit (that makes DB exhaustion worse). Put a pooler in front: PlanetScale's pooled connection, **Prisma Accelerate**, or a MySQL proxy (RDS Proxy / ProxySQL). Caps *total* DB connections regardless of function fan-out.

3. **Decouple the public polling rate from the DB.** Keep officials at 500 ms (few users, need realtime); for the **public** board either rely on the cache from (1) (so 500 ms is cheap) or raise its interval to 2–3 s. 500 ms *uncached* is the worst combination and is what we have now.

4. **Lighten the leaderboard query.** Select only required fields and consider a denormalised/precomputed standings snapshot updated on writes, instead of re-aggregating cards/laps/finishes on every request.

5. **Protect the write path.** Recommendations (1)+(2) already fix it by freeing connections. Until then, a real race with a crowd on the live board will see lap recording fail — treat (1) as a launch blocker for large events.

### Capacity, today vs. after fix

| | Concurrent public viewers before degradation |
|---|---|
| **Today** (500 ms, uncached) | ~25–30 |
| Old interval (5 s, uncached) | ~250 |
| **With a 1–2 s leaderboard cache** | thousands (DB load ≈ constant, independent of viewers) |

---

## How to re-run

```bash
# Reads only (no deploy / auth needed):
BASE_URL=https://racewalk-tournament.vercel.app EVENT_ID=evt-live \
  LEVELS=25,50,100,150 DUR=30 node loadtest/run-read.mjs

# Mixed read+write (needs LOADTEST_ENABLED=1 on the server; cookies+ids are
# fetched from the gated GET prep handler automatically):
BASE_URL=https://racewalk-tournament.vercel.app EVENT_ID=evt-live \
  SPECTATORS=50 LAP_RPS=4 CARD_RPS=0.5 DUR=30 node loadtest/run-write.mjs
```

## Cleanup / follow-ups

- **Disable the test endpoint:** unset `LOADTEST_ENABLED` on Vercel (it reverts to 404). Optionally remove `app/api/loadtest/` and revert commit `7b6a13d` if you don't want the endpoint in the repo at all.
- **Reseed the staging DB:** the write tests inserted junk laps (`lapNumber` 100000+), pushed `rnd-live-final.currentLap` to a large value, and added yellow cards to `evt-live`. Run your staging reseed (`npm run db:seed:reset`) to restore clean demo data.
- These results are for the staging DB tier; production capacity depends on its DB plan, but the architecture (uncached force-dynamic board) behaves the same — apply recommendation (1) regardless.
