# Head Judge · Workspace

**Route**: `/head-judge/events/[eventId]`
**Role**: [head-judge](../../personas/head-judge.md)
**Type**: Server page wrapping Client `HeadJudgeView`
**Status**: Implemented
**Code**:
- [app/head-judge/events/[eventId]/page.tsx](../../../app/head-judge/events/[eventId]/page.tsx)
- [components/head-judge/head-judge-view.tsx](../../../components/head-judge/head-judge-view.tsx)
- [app/actions/cards.ts](../../../app/actions/cards.ts) — `confirmRedCard`, `rejectRedCard`

## Purpose

Oversight dashboard for the head judge. Shows every athlete's aggregate card state across all judges, the round activity log, and the queue of pending red cards. Provides confirm/override actions on red cards.

## UI Sections

1. **Event header** — event + round name, head-judge name and zone, links to scoreboard and logout
2. **Race status banner** — derived from `roundStatus`
3. **Pending red cards** (ใบแดงรอยืนยัน) — one row per `PENDING` red, with bib, athlete, symbol + Thai label, issuing judge + zone, time:
   - "ยืนยัน" (confirm) → `confirmRedCard(cardId)` Server Action
   - "ยกเลิก" (override) → `rejectRedCard(cardId)` Server Action
4. **Athletes summary** (นักกีฬาในรอบนี้) — table with aggregates from every judge:
   - Bib, name, affiliation
   - Yellow total (Y), confirmed red total (R ยืนยัน), pending red total (R รอ)
   - Status (`OK` / `DQ` / `DNF`)
5. **Activity log** (บันทึกกิจกรรม) — append-only `RoundActivityLog` timeline for the round (latest 50), rendered via `RoundActivityLogLine`

## Data Displayed

The Server Component requires a valid official session (`getOfficialSession()`, position `HEAD_JUDGE`, matching `eventId`) and queries Prisma for the round, its `roundAthletes` (start-list order, with affiliation), `roundOfficials` (judge names/zones), `cards` (with judge + athlete), and `activityLogs` (latest 50), plus the event's `eventAthletes` for BIB lookup. It projects:

- `PendingCard[]` — red cards with `state === "PENDING"`, joined to the issuing judge's zone
- `AthleteRow[]` — per-athlete yellow count, confirmed-red count, pending-red count, status
- `LogItem[]` — denormalized actor/target strings from `RoundActivityLog`

## Actions

- Confirm a pending red card → `confirmRedCard` (atomic `PENDING → CONFIRMED`; idempotent if already decided). When confirmed reds reach 4 (`RED_CARDS_TO_DQ`) the athlete is set to `DQ`; if that empties the field the round auto-finishes.
- Override (reject) a red card → `rejectRedCard` (atomic `PENDING → OVERRIDDEN`; overridden reds never count toward DQ).
- Both handlers show a toast and call `router.refresh()`. The acting card's buttons stay disabled for the whole transition; the server actions are also idempotent as a backstop against double-clicks.
- Logout → `logoutOfficial()` clears the cookie and returns to the join page.

## Features Surfaced

- [card-scoring](../../features/card-scoring.md) (confirm/override side)
- [event-logging](../../features/event-logging.md) (read-only view of the round log)

## State / Behavior

- Server-rendered data from Prisma; the client `HeadJudgeView` holds only transition/acting state.
- Confirm/override decisions persist via Server Actions (`Card.state`, `decidedBy`, `decidedAt`) and are recorded in the activity log (`red_card_confirm` / `red_card_override`).
- **Real-time:** `AutoRefresh` calls `router.refresh()` every 2000ms while the round is `SCHEDULED`, 2500ms otherwise, so cards appear as judges issue them. An `OfficialEndedDialog` opens when the round is `FINISHED`.

## TODOs

- (none outstanding — real-time refresh, persistence, and confirm/override auditing are all implemented)
