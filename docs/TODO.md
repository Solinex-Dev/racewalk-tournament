# TODO

Open items across the project — features not yet built, decisions not yet made, gaps left from the Judtang port. Loosely grouped by theme; not strict execution order.

Items marked **(R2)**, **(R3)**, etc. are tagged with the Judtang-port round they belong to.

---

## Round 2 — Domain in Prisma

The point of Round 2 is to replace all `MOCK_*` constants in admin pages with real Prisma reads.

### Schema
- [ ] Add domain models to [prisma/schema.prisma](../prisma/schema.prisma):
  - [ ] `Event` (+ `EventStatus` enum)
  - [ ] `Round` (+ `RoundStatus` enum)
  - [ ] `Athlete`, `Affiliation`
  - [ ] `Judge` (pool of officials)
  - [ ] `RoundAthlete` (join, with `position`, `status`)
  - [ ] `RoundOfficial` (join, with `OfficialPosition` enum and `secret_code`)
  - [ ] `Card` (+ `CardColor`, `CardSymbol`, `RedCardState` enums)
  - [ ] `LapTime`, `FinishTime`
  - [ ] `RoundActivityLog` (timeline per round; distinct from `ActivityLog` audit table)
- [ ] Decide bib uniqueness scope (per event / per season / global) — see [decisions/](decisions/)
- [ ] Decide whether `Card` is soft-delete or hard-delete on override
- [ ] Decide whether `LapTime` and `FinishTime` should share a table with a discriminator

### Seed
- [ ] Expand [prisma/seed.ts](../prisma/seed.ts) to seed:
  - [ ] Affiliations (handful)
  - [ ] Athletes (~10 with bibs)
  - [ ] Judges (pool, ~6)
  - [ ] One sample event with 2 rounds (matching `evt-001` in current mocks)

### Replace MOCK_* with Prisma reads
- [ ] [app/admin/(pages)/admins/page.tsx](../app/admin/(pages)/admins/page.tsx) — replace `MOCK_ADMINS`
- [ ] [app/admin/(pages)/events/page.tsx](../app/admin/(pages)/events/page.tsx) — replace `MOCK_EVENTS`
- [ ] [app/admin/(pages)/events/[eventId]/moderator/page.tsx](../app/admin/(pages)/events/%5BeventId%5D/moderator/page.tsx) — replace `MOCK_EVENT_STATUS`, `MOCK_ATHLETES_BY_ROUND`, `MOCK_JUDGES_BY_ROUND`, `MOCK_ACTIVITY_LOGS`, `MOCK_PENDING_RED_CARDS`
- [ ] [app/events/[eventId]/page.tsx](../app/events/%5BeventId%5D/page.tsx) — replace `MOCK_PUBLIC_EVENT`
- [ ] [app/head-judge/events/[eventId]/page.tsx](../app/head-judge/events/%5BeventId%5D/page.tsx)
- [ ] [app/event-logger/events/[eventId]/page.tsx](../app/event-logger/events/%5BeventId%5D/page.tsx)
- [ ] [app/judge/events/[eventId]/page.tsx](../app/judge/events/%5BeventId%5D/page.tsx) — replace `MOCK_JUDGE_EVENT_INFO`
- [ ] [components/judge/judge-workspace.tsx](../components/judge/judge-workspace.tsx) — replace `INITIAL_ATHLETES`
- [ ] [app/timekeeper/events/[eventId]/page.tsx](../app/timekeeper/events/%5BeventId%5D/page.tsx) — replace `INITIAL_ATHLETES`
- [ ] [components/rounds/round-form.tsx](../components/rounds/round-form.tsx) — replace `MOCK_ATHLETE_OPTIONS`, `MOCK_JUDGE_OPTIONS`; wire `generateRoundSecretCode()` to actually persist
- [ ] [components/judge/judge-join-form.tsx](../components/judge/judge-join-form.tsx) — replace `MOCK_CODE_DESTINATIONS` lookup with server-side code validation

### Write path
- [ ] Decide on **server actions vs. route handlers** for admin CRUD vs. live workspace writes
- [ ] Wire every form's `onSubmit` (currently `console.log` + `alert("(mock)")`) to a real call:
  - [ ] `EventForm`
  - [ ] `RoundForm` (also generates and persists `secret_code` per official)
  - [ ] `AthleteForm`, `AffiliationForm`, `JudgeForm`
  - [ ] `AdminForm` — POST to the existing admin-only `/api/auth/register` endpoint
- [ ] Judge workspace card-issue actions → POST to write `Card` rows + update `Athlete` status if DQ
- [ ] Head judge confirm/override → mutate `Card.state`
- [ ] Event logger lap recording → write `LapTime`
- [ ] Timekeeper lap recording (+ undo) → write/delete `LapTime`

### UI patterns ported from Judtang (apply during R2 work)
- [ ] **shadcn `Calendar` (react-day-picker)** for date fields in `EventForm` and `RoundForm`. Add deps: `react-day-picker`, `date-fns`; run `npx shadcn@latest add calendar date-picker`
- [ ] **MRU picker pattern** — port `AthleteCombobox` and `JudgeCombobox` from Judtang's `AccountCombobox`/`CategoryCombobox` shape. Storage keys: `racewalk_recent_athletes`, `racewalk_recent_judges`. Speeds up round configuration when admin creates many rounds in one session.

---

## Round 3 — Real-time sync

The hardest open problem. Today every viewer has frozen state.

- [ ] Pick a mechanism — see [decisions/README.md](decisions/README.md):
  - [ ] Polling (simple, wasteful)
  - [ ] SSE (one-way, easy on Next.js)
  - [ ] WebSocket (two-way, needs broker)
  - [ ] Managed (Pusher / Ably)
- [ ] Decide what propagates in real time:
  - [ ] Card issuances across judges → head judge → moderator → public scoreboard
  - [ ] Lap times → public scoreboard
  - [ ] Round status transitions
- [ ] Server-clock for race timer (today the timekeeper page resets timer on reload)
- [ ] Cache invalidation strategy — Judtang uses `revalidateTag` on mutation; mirror that pattern
- [ ] **Cache hot read paths** with `unstable_cache` + versioned tags (Judtang pattern). Candidates: event list, public scoreboard, athlete pool. Bump version string when serialized list shape changes
- [ ] **DashboardDataProvider pattern** — port from Judtang. Two modes:
  - `refresh()` — silent re-fetch, no skeleton (use on tick / on focus regain)
  - `load({ showLoadingOverlay: true })` — explicit reload, shows skeleton overlay
  Applies to moderator page, head-judge workspace, public scoreboard
- [ ] Decide whether to introduce a query library (SWR / TanStack Query) at this point, or wait

---

## Round 4 — Auth & security hardening

### Secret-code access (currently mock)
- [ ] Server-side code validation against `RoundOfficial.secret_code` (today it's client-side `MOCK_CODE_DESTINATIONS`)
- [ ] Code expiry (codes only valid during event window)
- [ ] Code revocation (admin can invalidate without regenerating round)
- [ ] Rate limit the join endpoint
- [ ] Decide: single-use code or multi-use within the round?
- [ ] Decide: store secret codes hashed (security) or plain (so admin can re-display)?
- [ ] Print-friendly handout listing each official's code

### NextAuth gaps from Round 1
- [x] **Registration: admin-invite only.** `POST /api/auth/register` is gated to require an authenticated ADMIN session. No public self-service. No Turnstile needed.
- [ ] Email service (pick: Resend / SMTP / Nodemailer) — still required for password reset flow (an admin can forget their own password). Lower priority than originally; can wait until first admin actually locks themselves out
- [ ] `POST /api/auth/forgot-password` — port from Judtang (depends on email)
- [ ] `POST /api/auth/reset-password` — port
- [ ] `POST /api/auth/verify-email` — likely not needed (admin-invite flow marks `emailVerified` at user creation)
- [ ] `POST /api/auth/restore-account` — port if/when account-deletion grace-period flow is exposed in UI
- [ ] If staying with Credentials only: drop Google provider from [auth.ts](../auth.ts) once we're confident

### Admin permission model
- [ ] Decide RBAC enum vs. flag-based — see [features/admin-mgmt.md](features/admin-mgmt.md)
- [ ] If staying with `UserRole = USER | ADMIN`, promote `User.title` to a discriminator with allowed values:
  - `Owner` — full access including admin CRUD
  - `Event Manager` — events / rounds / codes
  - `Score Officer` — read + report export only
- [ ] Add a permission gate around `/admin/admins/*` (today gated only by `role === "ADMIN"`)
- [ ] Audit log of admin actions (the `ActivityLog` table exists; just need to write to it from CRUD endpoints)

---

## Round 5 — Quality of life

### Loading & skeleton
- [ ] Add `app/loading.tsx` and per-route `loading.tsx` files (admin pages first)
- [ ] Add `components/ui/skeleton.tsx` from Judtang
- [ ] Replace transient "Loading…" text with skeletons that **mirror the final layout** (this is the Judtang rule)
- [ ] Use Suspense boundaries for slow data fetches (especially the moderator page)

### Toast notifications (Sonner)
- [ ] Add `sonner` package + `components/ui/sonner.tsx` (with Lucide icons)
- [ ] Replace every `alert("...(mock)")` call with `toast.success / .error / .info`
- [ ] Sync toast theme with the page theme (sidebar admin = light, in-event = dark)

### General UI polish
- [ ] Mobile layout for public scoreboard ([pages/public/event-live.md](pages/public/event-live.md))
- [ ] Print stylesheet for [event report](pages/admin/event-report.md)
- [ ] Confirm-on-tap for judge card-issue buttons (avoid accidental card)
- [ ] Undo last card in judge workspace (mirror timekeeper UX)

---

## Round 6 — Testing

- [ ] Add Jest + ts-jest + supertest (Judtang setup)
- [ ] `jest.config.js` with `@/` path alias
- [ ] First tests: auth API routes (`register`, `logout`, NextAuth callbacks)
- [ ] **Important note from Judtang's CLAUDE.md**: mock-heavy tests *hide* real DB/API issues. After core flows are in place, add at least one integration test that hits a real (test) database.
- [ ] Decide: do we want E2E (Playwright)? — useful for the multi-role real-time scenarios

---

## Round 7 — Production readiness

### Reporting & export
- [ ] Pick export libraries (`xlsx` / `pdfkit` / `@react-pdf/renderer`) — see [features/reporting-export.md](features/reporting-export.md)
- [ ] Define the federation-approved report layout
- [ ] Per-athlete certificate generation (optional)
- [ ] Print stylesheet for the event report page

### Deployment
- [ ] Pick host (Vercel / self-hosted Node + MySQL)
- [ ] Wire `NEXTAUTH_URL` per environment
- [ ] Database migrations strategy for production (currently `db:push` is local-only)
- [ ] Backup strategy for the database
- [ ] Document deployment in [operations/](operations/) (today only `getting-started.md` exists)

### Observability
- [ ] Decide on a logging solution (Judtang uses Winston) — maybe overkill for Racewalk
- [ ] Error tracking (Sentry?)
- [ ] Uptime monitoring for the public scoreboard
- [ ] Activity log retention policy

---

## Cross-cutting decisions (no ADR yet)

These appear across multiple rounds. Each should become an ADR before being acted on.

- [ ] **Real-time sync mechanism** (R3) — polling / SSE / WebSocket / managed
- [ ] **Pending vs. confirmed red card semantics** — does a pending red card count toward DQ before head judge confirms? See [product/domain-rules.md](product/domain-rules.md)
- [ ] **Bib uniqueness scope** — per event / per season / global
- [ ] **Admin permission model** — RBAC enum vs. flag-based
- [ ] **Server actions vs. route handlers** — which pattern dominates
- [ ] **Code storage** — hash secret codes or store plain?
- [ ] **Export format(s)** — CSV / XLSX / PDF
- [ ] **Soft-delete vs. hard-delete** for cards on override
- [ ] **Affiliation deletion** — what happens to athletes that reference it?
- [x] ~~**Registration self-service**~~ — **Closed:** admin-invite only. Endpoint gated to ADMIN role
- [ ] **Theme switching** — current docs say "no toggle" but reconsider once admin is logged in

---

## Documentation gaps

- [ ] Each `features/*.md` lists "TODOs before production" — those are also tracked here but should stay in their feature doc
- [ ] [`decisions/`](decisions/) has only ADR-0001; the cross-cutting decisions above are seeds for new ADRs
- [ ] Add an ADR for the **Judtang port** itself (what was taken, what was adapted, what was skipped)
- [ ] [`conventions/code-style.md`](conventions/code-style.md) doesn't yet cover the Prisma access pattern or the auth helper pattern — update after Round 2
- [ ] [`architecture/state-and-data-flow.md`](architecture/state-and-data-flow.md) mentions mocks throughout; update to reflect Round 1 (auth is real, domain is mock) and again after each round

---

## Repo hygiene

- [x] ~~Commit `package-lock.json`~~ — removed from `.gitignore`. Reproducible builds
- [x] ~~Lint rule `@typescript-eslint/no-explicit-any: error`~~ — added to `eslint.config.mjs` (also `no-unused-vars` with `_` ignore pattern)
- [ ] Add a `prisma db check` script + a `prisma/check.sql` for sanity queries (Judtang has this)
- [ ] Consider Vercel analytics + speed insights (Judtang includes them; low-cost addition)
- [ ] Run `npm run lint` once against the existing codebase — the new `no-explicit-any` rule may surface `any` usages in current files
