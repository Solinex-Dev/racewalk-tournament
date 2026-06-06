# Load testing the live race surfaces

Simulates a live racewalk event: many spectators polling the public leaderboard +
a few officials polling their workspaces, all at 500 ms, plus a trickle of writes
(laps + cards). Defaults target **~50–100 concurrent users**.

The hot path is `router.refresh()` → re-runs the page's Server Component → Prisma
queries. The leaderboard query is the heaviest (nested `event → rounds →
roundAthletes → athlete/affiliation, cards, lapTimes, finishTimes`), so that's
what we hammer.

---

## ⛔ Read this first (safety)

1. **Never point this at the production database.** The repo's `.env` defaults to
   the prod DB (`147.50.254.12:3306`). Run staging with `DATABASE_URL` pointed at a
   **throwaway / staging DB**. The write scenarios insert junk laps and cards —
   reseed the DB afterwards (`npm run db:seed:reset` style on the throwaway DB).
2. **Use a production build, not `npm run dev`.** Turbopack dev is far slower than
   prod; dev numbers are meaningless. On staging: `npm run build && npm start`.
3. The write endpoint (`app/api/loadtest/route.ts`) is **inert** unless
   `LOADTEST_ENABLED=1`. Set it only on staging for the test, then **delete the
   `app/api/loadtest` folder** before going live.

---

## Setup

### 1. Prepare the staging server
```bash
# On the staging box — DATABASE_URL must be a NON-prod DB, seeded with a realistic
# field of athletes in an ONGOING round.
LOADTEST_ENABLED=1 LOADTEST_TOKEN=some-shared-secret npm start   # after npm run build
```
> Want a bigger field? Seed more `RoundAthlete` rows so the leaderboard query is
> representative of race day.

### 2. Fill in `loadtest/config.json`
```bash
cp loadtest/config.example.json loadtest/config.json
```
Get the IDs from the staging DB (MySQL/MariaDB):
```sql
-- An ONGOING round + its event
SELECT r.id AS roundId, r.eventId
FROM Round r WHERE r.status = 'ONGOING' AND r.deletedAt IS NULL LIMIT 1;

-- Athletes in that round (athleteId + bib)
SELECT ra.athleteId, ra.bib
FROM RoundAthlete ra WHERE ra.roundId = '<roundId>' AND ra.deletedAt IS NULL;

-- One real official per position (used for auth + attribution)
SELECT ro.id AS officialId, ro.judgeId, ro.position
FROM RoundOfficial ro WHERE ro.roundId = '<roundId>' AND ro.deletedAt IS NULL;
```
Put `baseUrl`, `eventId`, `roundId`, the `athletes`, and one official per role into
`config.json`. The official `judgeId`/`officialId` should be **real ids from that
round** and the `position` must match the role, so the actions behave normally.

### 3. Mint official cookies (for the workspace + write scenarios)
```bash
NEXTAUTH_SECRET="<the STAGING server's secret>" node loadtest/mint-cookies.mjs
# → writes loadtest/cookies.json
```
> Skip this step to run a **public-reads-only** test (leaderboard polling only).

### 4. Run k6
Install k6 (`brew install k6` / `choco install k6`) or use Docker:
```bash
# Local install
k6 run -e BASE_URL=https://staging.example.com \
       -e LOADTEST_TOKEN=some-shared-secret \
       loadtest/k6-race.js

# Docker (mount the folder so it can read config.json/cookies.json)
docker run --rm -i -e BASE_URL=https://staging.example.com \
  -e LOADTEST_TOKEN=some-shared-secret \
  -v "$PWD/loadtest:/loadtest" grafana/k6 run /loadtest/k6-race.js
```

---

## Tunables (`-e KEY=value`)

| Key            | Default | Meaning                                        |
| -------------- | ------- | ---------------------------------------------- |
| `BASE_URL`     | config  | Staging base URL                               |
| `SPECTATORS`   | `90`    | VUs polling the public leaderboard             |
| `OFFICIALS`    | `6`     | VUs polling judge/head-judge/logger workspaces |
| `LAP_RATE`     | `2`     | Lap writes per second                          |
| `CARD_RATE`    | `0.3`   | Card writes per second                         |
| `POLL_MS`      | `500`   | Poll interval (match the app)                  |
| `DURATION`     | `2m`    | Test length                                    |
| `WRITES`       | `1`     | `0` = reads only                               |
| `LOADTEST_TOKEN` | `""`  | Must match the server's `LOADTEST_TOKEN`       |

Start with a baseline (`-e SPECTATORS=50 -e WRITES=0`), then ramp `SPECTATORS` and
turn writes on. To find the ceiling, step `SPECTATORS` up (50 → 100 → 200…) until
latency/error thresholds break.

## Reading the results

- `http_req_duration` p95/p99 — broken down per request by the `kind` tag
  (`read_leaderboard`, `read_judge`, `write_lap`, …). The leaderboard p95 is the
  number that matters most.
- `http_req_failed` — should stay < 1%. Spikes usually mean the DB connection pool
  is exhausted (queries queueing) — the first thing to tune.
- Watch the staging DB (connections, slow query log) and the Node process (CPU,
  event-loop lag) while it runs.

Likely bottlenecks at this scale, in order: (1) the leaderboard Prisma query at
2 req/s × N viewers, (2) Prisma connection-pool size, (3) full-RSC payload size. If
the leaderboard p95 climbs, the cheapest wins are a lighter/denormalised leaderboard
query, a small (250–500 ms) cache on the public board, or a dedicated JSON endpoint
instead of a full RSC refresh.

## Cleanup

```bash
rm -rf app/api/loadtest          # remove the test write endpoint
rm loadtest/config.json loadtest/cookies.json   # local-only, contain ids/secrets
# unset LOADTEST_ENABLED / LOADTEST_TOKEN on the server, reseed the throwaway DB
```
