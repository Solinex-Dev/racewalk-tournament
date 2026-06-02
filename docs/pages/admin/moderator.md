# Admin · Moderator

**Route**: `/admin/events/[eventId]/moderator`
**Role**: [admin](../../personas/admin.md)
**Type**: Server Component (with client subcomponents)
**Code**: [app/admin/(pages)/events/[eventId]/moderator/page.tsx](../../../app/admin/(pages)/events/[eventId]/moderator/page.tsx)

## Purpose

The admin's **live control room** during an event. Combines event status, round/athlete oversight, judge config, pending card management, activity log, and export — the most feature-dense page in the system.

## UI Sections

1. **Event status header** — name, date, status (live / paused / finished)
2. **Round tabs** — switch between rounds
3. **Athletes by round** — table per round with the [card matrix](../../../components/judge/card-matrix.tsx); maxYellow and maxRed scale with number of judges
4. **Judges panel** — assigned judges, their positions, their secret codes
5. **Pending red cards** — confirm / reject queue
6. **Activity log** — timeline of all actions in the round
7. **Export modal** — trigger to produce official report

## Data Displayed

Sources (mock):
- `MOCK_EVENT_STATUS`
- `MOCK_ATHLETES_BY_ROUND`
- `MOCK_JUDGES_BY_ROUND`
- `MOCK_ACTIVITY_LOGS`
- `MOCK_PENDING_RED_CARDS`

## Actions

- Switch round
- Confirm a pending red card
- Reject (override) a pending red card
- Open export modal
- Edit moderator config → `/admin/events/[eventId]/moderator/edit`

## Features Surfaced

- [event-management](../../features/event-management.md) (status oversight)
- [round-configuration](../../features/round-configuration.md) (view + edit link)
- [secret-code-access](../../features/secret-code-access.md) (codes displayed here)
- [card-scoring](../../features/card-scoring.md) (oversight + pending queue)
- [event-logging](../../features/event-logging.md) (log view)
- [reporting-export](../../features/reporting-export.md) (export modal)

## State / Behavior

- This is intentionally the **single page admin keeps open during the race**
- Most data is read-only here; the actionable bits are the pending-card buttons
- The export modal is mocked

## TODOs

- Real-time data refresh
- Print-friendly view for code distribution at venue
- Permission gate (which admin sub-roles can override?)
