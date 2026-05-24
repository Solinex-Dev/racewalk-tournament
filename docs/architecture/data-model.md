# Data Model

The planned domain model for Prisma + MySQL, derived from the mock data shapes in the codebase today. Names are working titles — the actual Prisma schema is not yet committed.

## Entity overview

```
Admin
 │
 ▼ creates
Event ─── 1..N ──► Round ─── 1..N ──► RoundAthlete ──► Athlete ──► Affiliation
                       │
                       ├── 1..N ──► RoundOfficial ──► Judge
                       │                       (position, secret_code)
                       │
                       ├── 1..N ──► Card (yellow / red, by judge, on athlete)
                       │
                       ├── 1..N ──► LapTime
                       │
                       └── 1..N ──► ActivityLog
```

## Entities

### Admin

```typescript
Admin {
  id: string
  name: string
  role: string         // "owner" | "event manager" | "score officer"
  email: string
  status: "active" | "inactive"
  // + password hash, session info (planned)
}
```

Source today: `MOCK_ADMINS` in [app/admin/(pages)/admins/page.tsx](../../app/admin/(pages)/admins/page.tsx).

### Event

```typescript
Event {
  id: string
  name: string
  date: string         // ISO date
  location: string
  distance_km: string
  status: "draft" | "scheduled" | "ongoing" | "finished"
  isCurrent?: boolean  // at most one true across the table
  rounds: Round[]
}
```

Source today: `MOCK_EVENTS` and `MOCK_PUBLIC_EVENT`.

### Round

```typescript
Round {
  id: string
  eventId: string
  name: string
  status: "scheduled" | "ongoing" | "finished"
  distance_km?: string
  scheduled_time?: string
  expected_end_time?: string
  heat_name?: string
  lapCount?: number
  currentLap?: number
  note?: string
  athletes: RoundAthlete[]
  officials: RoundOfficial[]
}
```

### Athlete

```typescript
Athlete {
  id: string
  name: string
  bib: string           // race number; uniqueness scope TBD (per event? per season?)
  country: string
  affiliationId: string
}
```

### Affiliation

```typescript
Affiliation {
  id: string
  name: string
  // + logo, contact info (planned)
}
```

### Judge

The "pool" record. A judge's position is per-round.

```typescript
Judge {
  id: string
  name: string
  // + certification, contact (planned)
}
```

### RoundAthlete (join)

```typescript
RoundAthlete {
  roundId: string
  athleteId: string
  // computed at runtime:
  position?: number
  status: "OK" | "DQ" | "DNF"
}
```

### RoundOfficial (join)

```typescript
RoundOfficial {
  roundId: string
  judgeId: string
  position: "judge" | "head_judge" | "event_logger" | "timekeeper"
  secret_code: string   // 6 chars, alphanumeric, charset ABCDEFGHJKLMNPQRSTUVWXYZ23456789
  zone?: string         // e.g. "A1", "B2" for course sector
}
```

### Card

```typescript
Card {
  id: string
  roundId: string
  athleteId: string
  judgeId: string       // who issued
  color: "yellow" | "red"
  symbol: ">" | "~"
  issuedAt: string
  // for red cards only:
  state?: "pending" | "confirmed" | "overridden"
  decidedBy?: string    // head judge id
  decidedAt?: string
}
```

Card-level constraints (enforced server-side):

- `MAX_YELLOW = 2` per (round, athlete, judge) — one per symbol
- `MAX_RED = 1` per (round, athlete, judge)
- An athlete with 4 confirmed red cards becomes `DQ`

See [features/card-scoring](../features/card-scoring.md) and [product/domain-rules](../product/domain-rules.md).

### LapTime

```typescript
LapTime {
  id: string
  roundId: string
  athleteId: string
  lapNumber: number
  time: string          // "MM:SS" or "HH:MM:SS"
  timestamp: string
  recordedBy: string    // judge id (timekeeper or event logger)
  source: "timekeeper" | "event_logger"
}
```

### FinishTime

```typescript
FinishTime {
  id: string
  roundId: string
  athleteId: string
  time: string
  position: number
  recordedAt: string
}
```

### ActivityLog

The single timeline of everything that happened in a round.

```typescript
ActivityLog {
  id: string
  roundId: string
  timestamp: string
  actor: string         // role display name
  actorId: string       // judge id or admin id
  role: "judge" | "moderator" | "head_judge" | "event_logger"
  action: string        // human-readable
  actionType: "yellow_card" | "red_card" | "red_card_confirm" | "red_card_override" | "round_start" | "round_end" | "lap_time" | "finish_time" | "other"
  targetAthlete?: string
  targetBib?: string
  lapNumber?: number
  details?: string
  canOverride?: boolean // for red_card entries, whether head judge can still act
}
```

## Status enums summary

| Enum | Values |
|------|--------|
| Athlete status | `OK` · `DQ` · `DNF` |
| Event status | `draft` · `scheduled` · `ongoing` · `finished` |
| Round status | `scheduled` · `ongoing` · `finished` |
| Admin status | `active` · `inactive` |
| Card color | `yellow` · `red` |
| Card symbol | `>` · `~` |
| Red card state | `pending` · `confirmed` · `overridden` |
| RoundOfficial position | `judge` · `head_judge` · `event_logger` · `timekeeper` |
| ActivityLog actionType | `yellow_card` · `red_card` · `red_card_confirm` · `red_card_override` · `round_start` · `round_end` · `lap_time` · `finish_time` · `other` |

## Open questions before Prisma schema

- Bib uniqueness scope: per event? per season? globally?
- Should `Athlete` carry historical card counts, or always re-aggregate from `Card`?
- Affiliation deletion behavior when athletes still reference it
- Whether `LapTime` and `FinishTime` should be one table with a discriminator
- Whether `Card` should be soft-delete (preserve audit) or hard-delete on override
- Whether secret codes are stored hashed (security) or plain (so admin can re-display)
