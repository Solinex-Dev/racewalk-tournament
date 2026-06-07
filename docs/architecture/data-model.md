# Data Model

The domain model as implemented in Prisma. Source of truth: [prisma/schema.prisma](../../prisma/schema.prisma) (MySQL / MariaDB via `@prisma/adapter-mariadb`).

Status: **Implemented.** All models below are real Prisma models that the app reads and writes.

## Conventions

- IDs are `String @id @default(cuid())` unless noted (`VerificationToken` has none).
- **Soft delete:** a nullable `deletedAt DateTime?` marks a row deleted; `null` = live. Present on every domain model and on `User`. `UserSession` uses `revokedAt` as its soft-revoke. `ActivityLog` and `VerificationToken` have no soft-delete.
- **Audit columns** `createdById String?` / `updatedById String?` appear on most domain + `User` models (absent on the join models `RoundAthlete` / `RoundOfficial` / `Round`).
- `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` are standard on domain models.
- **Split names:** `User`, `Athlete`, and `Judge` all carry `prefix / firstName / middleName / lastName` plus a denormalized `name` display field.

## Entity overview

```
User (admin) ── creates ──► Event ─── 1..N ──► Round
                              │                   │
                              │                   ├── 1..N ──► RoundAthlete ──► Athlete ──► Affiliation ──► Judge (head)
                              │                   ├── 1..N ──► RoundOfficial ──► Judge   (position, secretCode)
                 1..N ──► EventAthlete            ├── 1..N ──► Card (yellow / red)
                 (bib, sortOrder)                 ├── 1..N ──► LapTime
                              ▲                    ├── 1..N ──► FinishTime
                          Athlete                  └── 1..N ──► RoundActivityLog

Organization ─── 1..N ──► Department ─── (both) ──► Judge
```

> **BIB lives on `EventAthlete`** (event-scoped, unique per event), *not* on `RoundAthlete`. The same BIB is reused across every round in the event.

## Enums

| Enum | Values |
|------|--------|
| `UserRole` | `USER` · `ADMIN` |
| `UserStatus` | `ACTIVE` · `SUSPENDED` · `DELETED` |
| `EventStatus` | `DRAFT` · `SCHEDULED` · `ONGOING` · `FINISHED` |
| `RoundStatus` | `SCHEDULED` · `ONGOING` · `FINISHED` |
| `AthleteRoundStatus` | `OK` · `DQ` · `DNF` |
| `OfficialPosition` | `JUDGE` · `HEAD_JUDGE` · `EVENT_LOGGER` (no `TIMEKEEPER`) |
| `CardColor` | `YELLOW` · `RED` |
| `CardSymbol` | `LIFTED_FOOT` (`~` ยกเท้า) · `BENT_KNEE` (`>` เข่างอ) |
| `RedCardState` | `PENDING` · `CONFIRMED` · `OVERRIDDEN` |
| `JudgeStatus` | `ACTIVE` · `INACTIVE` (operational; distinct from `deletedAt`) |

## Auth models

### User

The admin/account record (regular users are `role = USER`; admins are `role = ADMIN`).

```typescript
User {
  id: string
  name?: string            // denormalized display name
  prefix?, firstName?, middleName?, lastName?: string
  email?: string @unique
  emailVerified?: DateTime
  image?: string
  password?: string @db.Text   // bcrypt hash; null for OAuth-only
  title?: string               // free-text display label, distinct from role
  role: UserRole @default(USER)
  isRoot: boolean @default(false)   // bypasses fine-grained permission checks
  permissions?: Json                // { <resource>: { view, create, edit, delete } }
  lastActiveAt?: DateTime
  status: UserStatus @default(ACTIVE)
  suspendedAt?, deleteAfter?, deletedAt?: DateTime
  createdById?, updatedById?: string
}
```

Status lifecycle (`SUSPENDED` past `deleteAfter` resolves to `DELETED`) is in [lib/user-status.ts](../../lib/user-status.ts). Admin CRUD: [app/actions/admins.ts](../../app/actions/admins.ts).

### UserSession

One row per login; revocable.

```typescript
UserSession {
  id: string
  sessionId: string @unique
  userId: string
  userAgent?: string @db.Text
  ipAddress?: string
  lastActiveAt, createdAt: DateTime @default(now())
  revokedAt?: DateTime     // null = active (soft-revoke)
  rememberMe: boolean @default(false)
  expiresAt: DateTime
}
```

### Account / VerificationToken / ActivityLog

`Account` and `VerificationToken` are the standard Auth.js OAuth tables. `ActivityLog` is the append-only **system audit trail** (FK to `User`; fields `action`, `entityType?`, `entityId?`, `details Json?`, `method?`, `operation?`, `path?`, `ipAddress?`, `userAgent?`). Written via [lib/activity-log.ts](../../lib/activity-log.ts), which swallows errors so logging never breaks a request. Distinct from `RoundActivityLog` (below).

## Domain models

### Organization → Department → Judge hierarchy

```typescript
Organization { id, name, note?, /* audit + soft-delete */ }     // managing body
Department   { id, organizationId, name, note?, ... }           // @@unique([organizationId, name])
```

A `Judge` may point at `organizationId` and/or `departmentId` (both nullable). Managed via [app/actions/organizations.ts](../../app/actions/organizations.ts) (gated under the `judges` permission resource).

### Affiliation

The athlete-side club/affiliation body. Its head is a `Judge` (named relation `AffiliationHead`) — separate from the Organization/Department hierarchy.

```typescript
Affiliation {
  id, name
  country: string @default("TH")
  province?: string
  headJudgeId?: string     // -> Judge (relation "AffiliationHead")
  joinedAt?: DateTime
  note?: string
  /* audit + soft-delete */
}
```

### Athlete

```typescript
Athlete {
  id, name
  prefix?, firstName?, middleName?, lastName?: string
  country: string @default("TH")
  province?, club?, note?: string
  affiliationId?: string
  /* audit + soft-delete */
}
```

Relations: `eventAthletes`, `roundAthletes`, `cards`, `lapTimes`, `finishTimes`. CRUD: [app/actions/athletes.ts](../../app/actions/athletes.ts).

### Judge

The pool record; a judge's *position* is per-round (see `RoundOfficial`).

```typescript
Judge {
  id, name
  prefix?, firstName?, middleName?, lastName?: string
  country: string @default("TH")
  province?: string
  organizationId?, departmentId?: string
  status: JudgeStatus @default(ACTIVE)
  note?: string
  /* audit + soft-delete */
}
```

CRUD: [app/actions/judges.ts](../../app/actions/judges.ts).

### Event

```typescript
Event {
  id, name
  date: DateTime           // calendar day (date-only, derived from startTime)
  startTime?, endTime?: DateTime
  location: string
  distanceKm: string       // stored in KILOMETRES, as a String
  lapCount: int @default(1)
  status: EventStatus @default(DRAFT)
  /* audit + soft-delete */
}
```

> `distanceKm` is a `String` and stores **kilometres**; the UI presents and accepts **metres** (conversion in [lib/distance.ts](../../lib/distance.ts)). CRUD: [app/actions/events.ts](../../app/actions/events.ts).

### Round

```typescript
Round {
  id, eventId, name
  status: RoundStatus @default(SCHEDULED)
  distanceKm?: string
  scheduledTime?, expectedEndTime?: DateTime
  startedAt?: DateTime     // set on SCHEDULED -> ONGOING
  endedAt?: DateTime       // set on ONGOING -> FINISHED (single source for elapsed time)
  heatName?: string
  lapCount?: int
  currentLap: int @default(0)   // advanced forward by lap/finish writes
  note?: string
  /* soft-delete; no createdById/updatedById */
}
```

CRUD: [app/actions/rounds.ts](../../app/actions/rounds.ts). Start/stop timing: [app/actions/round-timing.ts](../../app/actions/round-timing.ts).

### EventAthlete (join — registration, **BIB lives here**)

```typescript
EventAthlete {
  id, eventId, athleteId
  bib: string
  sortOrder: int @default(0)   // event display order (ties -> bib)
  /* audit + soft-delete */
}
// @@unique([eventId, athleteId]), @@unique([eventId, bib])
```

BIB format is validated in [lib/bib.ts](../../lib/bib.ts): `[age band 2–3 digits, multiple of 5, ≥35][3-digit sequence]` (e.g. `65001`).

### RoundAthlete (join — start list + result)

```typescript
RoundAthlete {
  id, roundId, athleteId
  sortOrder: int @default(0)   // start-list order; drives lap-keeper numbering
  status: AthleteRoundStatus @default(OK)
  dqReasonCode?: string        // WA rule code for post-race DQ (e.g. "TR54.7.5")
  position?: int
  /* soft-delete; no audit columns; no bib (it's on EventAthlete) */
}
// @@unique([roundId, athleteId])
```

### RoundOfficial (join — official assigned to a round)

```typescript
RoundOfficial {
  id, roundId, judgeId
  position: OfficialPosition
  secretCode: string           // 6-char join code, charset ABCDEFGHJKLMNPQRSTUVWXYZ23456789
  zone?: string
  /* soft-delete */
}
// @@unique([roundId, judgeId]), @@unique([roundId, secretCode])
```

`secretCode` is stored in plaintext so admins can re-display it. Generation uses `crypto.getRandomValues` ([components/rounds/round-form.tsx](../../components/rounds/round-form.tsx)). Per-round caps: 8 JUDGE, 1 HEAD_JUDGE, 1 EVENT_LOGGER. Codes are also enforced unique event-wide. See [features/secret-code-access](../features/secret-code-access.md).

### Card (yellow / red)

```typescript
Card {
  id, roundId, athleteId, judgeId
  color: CardColor
  symbol: CardSymbol           // non-nullable even on yellow cards
  issuedAt: DateTime @default(now())
  // red-card-only:
  state?: RedCardState
  decidedBy?: string           // head judge user/judge id
  decidedAt?: DateTime
  deletedAt?: DateTime         // overrides set state = OVERRIDDEN, not delete
}
```

Constraints (enforced in server actions, not the schema):

- **Yellow:** max 1 per symbol per judge per athlete per round (→ effectively `MAX_YELLOW = 2`). Immediate notes, no confirmation, never count toward DQ.
- **Red:** max 1 per judge per athlete per round; created `PENDING`, head judge confirms or overrides.
- An athlete with **4 `CONFIRMED` red cards** becomes `DQ` (`RED_CARDS_TO_DQ = 4`, hard-coded in [app/actions/cards.ts](../../app/actions/cards.ts) and [app/actions/moderator.ts](../../app/actions/moderator.ts)).

Note: `symbol` is non-nullable on every card, though the domain treats yellow cards as symbol-less notes. See [features/card-scoring](../features/card-scoring.md) and [product/domain-rules](../product/domain-rules.md).

### LapTime

```typescript
LapTime {
  id, roundId, athleteId
  lapNumber: int
  timeMs: int                  // race elapsed time in milliseconds
  recordedAt: DateTime @default(now())
  recordedBy: string           // session.judgeId
  source: string               // session.position (e.g. "EVENT_LOGGER")
  deletedAt?: DateTime
}
// no uniqueness on (round, athlete, lapNumber)
```

### FinishTime

```typescript
FinishTime {
  id, roundId, athleteId
  timeMs: int                  // milliseconds
  position: int                // auto-assigned: 1 = first to finish
  recordedAt: DateTime @default(now())
  deletedAt?: DateTime
}
// @@unique([roundId, athleteId])
```

Lap and finish writes live in [app/actions/timing.ts](../../app/actions/timing.ts) (recorded by the `EVENT_LOGGER` session).

### RoundActivityLog (per-round race timeline)

Distinct from the system `ActivityLog`. FK to `Round` only; actor/target are denormalized strings (no FK to Judge/Athlete).

```typescript
RoundActivityLog {
  id, roundId
  timestamp: DateTime @default(now())
  actorId: string
  actorName: string
  actorRole: string
  actionType: string           // "yellow_card" | "red_card" | "red_card_confirm" |
                               // "red_card_override" | "round_start" | "round_end" |
                               // "lap_time" | "finish_time" | "athlete_dq" | ...
  targetAthleteId?: string
  targetBib?: string
  lapNumber?: int
  details?: string @db.Text
  canOverride: boolean @default(false)
  deletedAt?: DateTime
}
```

## Status enums summary

| Enum | Values |
|------|--------|
| Athlete (round) status | `OK` · `DQ` · `DNF` |
| Event status | `DRAFT` · `SCHEDULED` · `ONGOING` · `FINISHED` |
| Round status | `SCHEDULED` · `ONGOING` · `FINISHED` |
| User role / status | `USER`/`ADMIN` · `ACTIVE`/`SUSPENDED`/`DELETED` |
| Card color / symbol | `YELLOW`/`RED` · `LIFTED_FOOT` (`~`)/`BENT_KNEE` (`>`) |
| Red card state | `PENDING` · `CONFIRMED` · `OVERRIDDEN` |
| Official position | `JUDGE` · `HEAD_JUDGE` · `EVENT_LOGGER` |
| Judge status | `ACTIVE` · `INACTIVE` |

## Settled decisions (formerly open questions)

- **BIB uniqueness:** per event — `@@unique([eventId, bib])` on `EventAthlete`; reused across the event's rounds.
- **Card counts:** always re-aggregated from `Card` rows (no denormalized counters on `Athlete`).
- **Affiliation deletion:** soft-delete via `deletedAt`; athletes keep their `affiliationId`.
- **Lap vs finish:** separate tables (`LapTime`, `FinishTime`), not one discriminated table.
- **Card delete:** soft-delete (preserves audit); overrides keep the row with `state = OVERRIDDEN`.
- **Secret codes:** stored plaintext so admins can re-display them.
