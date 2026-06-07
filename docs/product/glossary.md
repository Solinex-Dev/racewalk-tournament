# Glossary

Terms used across the system. The UI ships in **Thai only**; English equivalents are listed here as a translation aid for maintainers reading the docs.

## Domain terms

| Term | Thai | Definition |
|------|------|------------|
| **Racewalk** | เดินทน / เดินเร็ว | A long-distance walking discipline with strict technique rules |
| **Bent knee** | งอเข่า | Technique fault — advancing knee was bent under the body. Card symbol: `>` (`BENT_KNEE`) |
| **Lifted foot** | ยกเท้า | Technique fault — loss of contact, both feet airborne. Card symbol: `~` (`LIFTED_FOOT`) |
| **Yellow card** | ใบเตือน | A judge's warning. Max 1 per symbol per judge per athlete (2 total). Immediate, non-disqualifying |
| **Red card** | ใบแดง | A judge's penalty call. Max 1 per judge per athlete. 4 confirmed → DQ |
| **DQ** | ตัดสิทธิ์ | Disqualified — athlete reached 4 confirmed red cards (or a moderator post-race ruling) |
| **DNF** | ไม่จบการแข่งขัน | Did not finish |
| **Bib** | เบอร์เสื้อ | Athlete's race number. Event-scoped (stored on `EventAthlete`, unique per event) |
| **Heat** | รุ่น | A categorized group within an event (e.g. age/distance class) |
| **Affiliation** | สังกัด / สโมสร | The club, school, or organization an athlete represents |

## Roles

| Role | Thai | Description |
|------|------|-------------|
| **Admin** | ผู้ดูแลระบบ | Configures events, generates secret codes. Logs in with email + password |
| **Head Judge** | กรรมการหัวหน้า | Oversees judging panel; confirms/overrides red cards |
| **Judge** | กรรมการ | Issues yellow/red cards from the side of the course |
| **Event Logger** | ผู้บันทึกเหตุการณ์ | Records lap times and finish times manually |
| **Timekeeper** | ผู้จับเวลา | Records laps with a stopwatch (shares the Event Logger recording path) |
| **Public Viewer** | ผู้ชม | Watches the live scoreboard, no authentication |

## System terms

| Term | Definition |
|------|------------|
| **Event** | A racewalk competition (one date, one location). Contains one or more rounds |
| **Round** | A single race within an event. Has its own distance, athletes, officials |
| **Secret code** | 6-character alphanumeric code generated per official per round (`RoundOfficial.secretCode`). Used to join the live workspace; a valid join issues the `rw_official_session` cookie |
| **Official session** | Signed (jose HS256) `rw_official_session` cookie issued after a secret-code join; carries position + round/event ids. 12h TTL, slid on activity. See [lib/official-jwt.ts](../../lib/official-jwt.ts) |
| **Live scoreboard** | The public-facing real-time view of an event. Client-polls the CDN-cached JSON endpoint [app/api/events/[eventId]/leaderboard/route.ts](../../app/api/events/[eventId]/leaderboard/route.ts) every 5s |
| **Activity log** | Two stores: the system audit `ActivityLog` (FK to User) and the per-round `RoundActivityLog` race timeline (cards issued, laps recorded, etc.) |
| **Pending red card** | A red card in state `PENDING`, awaiting head-judge confirmation. Excluded from the public total |
| **Override** | Head judge (or moderator) action that cancels a red card — state `OVERRIDDEN` |

## Card system terms

| Term | Definition |
|------|------------|
| **Card matrix** | The grid UI showing each athlete's yellow and red cards as symbols. See [components/judge/card-matrix.tsx](../../components/judge/card-matrix.tsx) |
| **Card detail** | Per-card metadata: symbol, which judge issued it, whether it's from "this judge" (for highlighting) |
| **Per-judge limit** | Constraint enforced server-side in the issuing action (1 yellow per symbol, 1 active red per athlete) |
| **Aggregate limit** | Constraint across all judges (4 confirmed red → DQ) |

## Status enums

Stored values use UPPERCASE (see [prisma/schema.prisma](../../prisma/schema.prisma)).

### Athlete round status (`AthleteRoundStatus`)
`OK` | `DQ` | `DNF`

### Event status (`EventStatus`)
`DRAFT` | `SCHEDULED` | `ONGOING` | `FINISHED`

### Round status (`RoundStatus`)
`SCHEDULED` | `ONGOING` | `FINISHED`

### Official position (`OfficialPosition`)
`JUDGE` | `HEAD_JUDGE` | `EVENT_LOGGER` — no `TIMEKEEPER` value

### Red card state (`RedCardState`)
`PENDING` | `CONFIRMED` | `OVERRIDDEN`

### Admin (User) status (`UserStatus`)
`ACTIVE` | `SUSPENDED` | `DELETED` — lifecycle resolved in [lib/user-status.ts](../../lib/user-status.ts)

### Judge operational status (`JudgeStatus`)
`ACTIVE` | `INACTIVE` — distinct from soft-delete; `INACTIVE` judges are hidden from dropdowns but kept

### Round activity-log `actionType`
`yellow_card` | `red_card` | `red_card_confirm` | `red_card_override` | `athlete_dq` | `round_start` | `round_end` | `lap_time` | `finish_time`
