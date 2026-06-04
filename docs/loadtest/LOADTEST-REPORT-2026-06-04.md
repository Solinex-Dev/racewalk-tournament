# Load Test Report — Racewalk Tournament (staging)

**Date:** 2026-06-04
**Target:** `https://racewalk-tournament.vercel.app` (Vercel serverless + self-hosted MySQL/MariaDB staging DB)
**Event under test:** `evt-live` — round `rnd-live-final`, **24 athletes** (ONGOING)
**Deployed commits:** cache `842b1e5`, full-panel prep `76d56cf`, pool/poll fix `c45b6f9` (all on `develop`)
**Driver:** pure-Node concurrent drivers in `loadtest/` (Docker/k6 unavailable on the runner). Each virtual user polls every 500 ms via an `RSC` GET, exactly like a browser tab.

---

## Bottom line

- **The 10-official panel (8 judges + head judge + event logger) works reliably in real use** — as long as concurrent **spectators stay ≲ 50–80**. At 50 spectators + the full panel, official writes succeed **0 failures** and every read is < 0.5 s p95.
- The officials only get starved when a **large public crowd (~100+ concurrent)** shares the same database — and that is the *spectators* exhausting DB connections, not the officials' own load.
- **Two fixes are deployed**, both app-side (no DB-config change, which the host doesn't allow):
  1. Cache the public leaderboard query (2 s) — spectators stop hammering the DB.
  2. Cap the DB pool per serverless instance (`connectionLimit=3`) + slow official polling to 1.5 s.
- For events expecting **100+ concurrent viewers**, add a managed connection pooler (**Prisma Accelerate**) — it caps *total* DB connections and needs no DB-config change.

---

## Root cause

The app is Vercel **serverless**: each concurrent request can spin up a function instance, and **each instance keeps its own DB connection pool**. The self-hosted MySQL/MariaDB has a fixed `max_connections` the host won't let us raise. Under load, `instances × pool-size` blows past that ceiling and queries fail with:

```
pool timeout: failed to retrieve a connection from pool after 10000ms
    (pool connections: active=0 idle=0 limit=…)
```

`active=0 idle=0` = the pool can't open *any* connection because the DB is already at its connection ceiling (held by other instances). Two things drove the connection demand:

1. **The public leaderboard** was `force-dynamic` + uncached → every spectator poll (500 ms) ran the heavy nested query and held a connection.
2. **The officials' own workspace pages** poll uncached at 500 ms → 10 officials = ~20 heavy queries/s holding connections (this was the surprise — the panel itself is a major load source).

---

## The journey (what each fix did)

### Stage 1 — Baseline (before any fix)
Public board, read-only, stepped concurrency (30 s/level):

| Viewers | req/s | p50 | p95 | p99 |
|--------:|------:|----:|----:|----:|
| 25 | 47.7 | 243 ms | 389 ms | 1.0 s |
| 50 | 13.6 | 1.9 s | **8.2 s** | 8.6 s |
| 100 | 10.8 | 10.1 s | 20.1 s | 21.4 s |
| 150 | 14.1 | 10.1 s | 10.5 s | 10.5 s |

Collapses between 25→50 viewers. Mixed read+write (spectators + a writer): at **50 spectators, official writes failed 98/101**.

### Stage 2 — Cache the public leaderboard (`842b1e5`)
A 2 s in-memory promise-cache on the leaderboard query. Read-only, after:

| Viewers | p50 | p95 | req/s |
|--------:|----:|----:|------:|
| 50 | 94 ms | **408 ms** | 93.3 |
| 100 | 90 ms | 9.4 s ⚠️ | 70.9 |
| 150 | 89 ms | 9.1 s ⚠️ | 104 |

Median dropped to ~90 ms (spectator reads now mostly skip the DB). Spectators ≤ 50 are solid; the 100+ tail remained because cache-miss reads + the officials still need DB connections.

### Stage 3 — Realistic race-day test (full panel) — *before* the pool fix
Spectators (cached board) **+ 8 judges + head + logger**, each polling their own **uncached** workspace at 500 ms + writing:

| Spectators | Spectator read p95 | Official read p95 | Official writes |
|-----------:|-------------------:|------------------:|:----------------|
| 50 | 10,070 ms | 10,108 ms | **2 ok / 18 fail** ❌ |
| 100 | — | — | prep query itself timed out |

This exposed that the **officials' own 500 ms uncached polling** (10 people) was a primary connection consumer — it dragged everything down, including the cached spectator tail.

### Stage 4 — Cap per-instance pool + slow official polling (`c45b6f9`) — *fix A*
`connectionLimit=3` (env `DB_CONNECTION_LIMIT`) in `lib/prisma.ts` + officials' `AutoRefresh` 500 ms → 1500 ms. Same race-day test, after:

| Spectators | Spectator read p95 | Official read p95 | Official writes |
|-----------:|-------------------:|------------------:|:----------------|
| **50** | 376 ms ✅ | 434 ms ✅ | **28 ok / 0 fail** ✅ |
| 100 | 354 ms ✅ | 386 ms ✅ | 2 ok / 16 fail ❌ (`limit=3` timeout) |

**At 50 spectators the full official panel works perfectly** (0 write failures, all reads < 0.5 s). At 100 spectators reads still hold, but writes fail again — Vercel spins up more instances as spectators grow, so `instances × 3` re-crosses the DB ceiling. A *per-instance* cap can't fix that at the high end; only a pooler that caps *total* connections can.

---

## What's deployed (all app-side, no DB-config change)

- `app/events/[eventId]/page.tsx` — 2 s cache on the public leaderboard query (officials' pages are intentionally **not** cached → realtime).
- `lib/prisma.ts` — `connectionLimit` per instance, default 3, tunable via `DB_CONNECTION_LIMIT`.
- `app/{judge,head-judge,event-logger}/events/[eventId]/page.tsx` — official poll interval 1.5 s (public board stays 500 ms; it's cached so it's cheap).

## Capacity verdict

| Scenario | Verdict |
|---|---|
| 10 officials, few/no spectators | ✅ Easily (light load) |
| 10 officials + up to ~50 concurrent spectators | ✅ Solid — 0 write failures |
| 10 officials + ~100+ concurrent spectators | ⚠️ Officials' writes get starved by the crowd |

## If you need 100+ concurrent viewers — Prisma Accelerate

Since the DB host's `max_connections` can't be changed, the fix must live **outside the DB**. **Prisma Accelerate** is a managed pooler that sits between Vercel and your DB: it keeps a small fixed pool to the database while accepting unlimited connections from serverless, and adds query caching. Change the connection to a `prisma://` URL + add `@prisma/extension-accelerate` — no DB-config change, no self-hosted proxy box. (Self-hosted ProxySQL is an alternative but needs an always-on box.)

## Cleanup / follow-ups

- **Turn off `LOADTEST_ENABLED` on Vercel** — the `/api/loadtest` endpoint is inert without it; while on it mints official cookies to anyone who calls it.
- **Reseed the staging DB** — the write tests inserted junk laps (`lapNumber` 200000+), bumped `rnd-live-final.currentLap`, and added cards. Run `npm run db:seed:reset`.
- Optionally remove `app/api/loadtest/` if you don't want the test endpoint in the repo.

## How to re-run

```bash
# Public board only (no auth/endpoint needed):
BASE_URL=https://racewalk-tournament.vercel.app EVENT_ID=evt-live \
  LEVELS=25,50,100,150 DUR=30 node loadtest/run-read.mjs

# Full race-day panel (needs LOADTEST_ENABLED=1 on the server):
BASE_URL=https://racewalk-tournament.vercel.app EVENT_ID=evt-live \
  SPECTATORS=50 JUDGES=8 DUR=40 node loadtest/run-raceday.mjs
```
