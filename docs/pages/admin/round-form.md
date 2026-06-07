# Admin · Round Form (Create / Edit)

**Routes**:
- `/admin/events/[eventId]/rounds/new` (create)
- `/admin/events/[eventId]/rounds/[roundId]` (edit)

**Role**: [admin](../../personas/admin.md)
**Type**: Server page wrapping Client `RoundForm`
**Status**: Implemented
**Code**:
- [app/admin/(pages)/events/[eventId]/rounds/new/page.tsx](../../../app/admin/(pages)/events/[eventId]/rounds/new/page.tsx)
- [app/admin/(pages)/events/[eventId]/rounds/[roundId]/page.tsx](../../../app/admin/(pages)/events/[eventId]/rounds/[roundId]/page.tsx)
- [components/rounds/round-form.tsx](../../../components/rounds/round-form.tsx)
- [app/actions/rounds.ts](../../../app/actions/rounds.ts) (write path)

## Purpose

Create or edit a round within an event. Configures the round's start list (athletes), its officials with positions, and generates each official's join secret code.

## UI Sections

1. **Round metadata**:
   - Name, distance (entered in metres, stored as km), scheduled time, expected end, lap count, status, note
2. **Start list** — athletes drawn from the parent event's registered athletes (with their event-level BIBs); drag-reorder (or type a new number) to set `sortOrder`, which drives the Lap Time keeper's sequential numbering
3. **Officials** — pick from the judge pool, each with:
   - Position: `JUDGE` | `HEAD_JUDGE` | `EVENT_LOGGER` (no timekeeper position in the schema)
   - Optional zone label
   - A generated 6-char secret code (read-only, copyable, regenerable per official)

## Data Displayed

The Server Component queries Prisma for the parent event's registered athletes (with BIBs), the global judge pool, the event day (rounds can't be scheduled before it), and the secret codes already used by other rounds in the event (so new/regenerated codes stay unique event-wide). On edit it loads the round's current athletes/officials. An `ONGOING` round is passed as `locked` (read-only).

## Actions

- Set metadata fields
- Add/remove/reorder athletes in the start list
- Add/remove officials, set position and zone
- Copy or regenerate an official's secret code
- Save → `createRound` / `updateRound` (`app/actions/rounds.ts`), gated by `requirePermission("events", create|edit)`, persisting via Prisma and writing an admin `ActivityLog`

## Secret codes & official limits

- `generateSecretCode()` uses **`crypto.getRandomValues`** over charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32 chars, no ambiguous I/O/0/1; 256 is a multiple of 32 → no modulo bias). `genUniqueSecret()` retries to avoid collisions.
- Per-round caps: `MAX_JUDGES = 8`, `MAX_HEAD_JUDGE = 1`, `MAX_EVENT_LOGGER = 1` (10 max). The server mirrors these (`assertOfficialLimits`) and enforces ≥1 of each to save a non-`SCHEDULED` round (`assertStartableOfficials`).
- Codes are stored on `RoundOfficial.secretCode`; the DB enforces `@@unique([roundId, secretCode])`, and the action additionally guards uniqueness event-wide (`assertEventUniqueSecretCodes`). The 6-char code is what officials enter on their join page (see [secret-code-access](../../features/secret-code-access.md)).

## State / Behavior

- Fully controlled with local `useState`; the form is locked read-only while the round is `ONGOING`
- Codes are auto-filled when officials are added and can be regenerated individually

## Validation (server)

- BIBs come from the event registration and are not edited here; uniqueness is enforced at the event level (`@@unique([eventId, bib])`)
- Scheduling guards (`lib/scheduling.ts`): round must fall within the event window (`assertRoundWithinEvent`) and not conflict with other rounds (`assertNoScheduleConflict`)
- Uniqueness violations (P2002) are rethrown as friendly Thai messages

## Features Surfaced

- [round-configuration](../../features/round-configuration.md) (primary)
- [secret-code-access](../../features/secret-code-access.md) (code generation)
- [card-scoring](../../features/card-scoring.md) (only via the athletes assigned here)

## TODOs

- Print-friendly handout listing each official's code
