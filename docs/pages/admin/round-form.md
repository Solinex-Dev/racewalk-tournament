# Admin · Round Form (Create / Edit)

**Routes**:
- `/admin/events/[eventId]/rounds/new` (create)
- `/admin/events/[eventId]/rounds/[roundId]` (edit)

**Role**: [admin](../../personas/admin.md)
**Type**: Server page wrapping Client `RoundForm`
**Code**:
- [app/admin/(pages)/events/[eventId]/rounds/new/page.tsx](../../../app/admin/(pages)/events/[eventId]/rounds/new/page.tsx)
- [app/admin/(pages)/events/[eventId]/rounds/[roundId]/page.tsx](../../../app/admin/(pages)/events/[eventId]/rounds/[roundId]/page.tsx)
- [components/rounds/round-form.tsx](../../../components/rounds/round-form.tsx)

## Purpose

Create or edit a round within an event. Configures athletes, judges (with positions), and generates secret codes.

## UI Sections

1. **Round metadata**:
   - Name, heat name, distance, scheduled time, expected end, lap count, note
2. **Athletes** — multi-select from `MOCK_ATHLETE_OPTIONS`
3. **Officials** — multi-select from `MOCK_JUDGE_OPTIONS` with per-row:
   - Position: `judge` | `head_judge` | `event_logger` | `timekeeper`
   - Generated secret code (read-only display, regenerable)

## Data Displayed

- `MOCK_ATHLETE_OPTIONS` — pool of athletes
- `MOCK_JUDGE_OPTIONS` — pool of judges
- On edit: the round row from the event's rounds[]

## Actions

- Set metadata fields
- Add/remove athlete from round
- Add/remove judge from round, set their position
- `generateRoundSecretCode()` is called per official at save time

## Features Surfaced

- [round-configuration](../../features/round-configuration.md) (primary)
- [secret-code-access](../../features/secret-code-access.md) (code generation)
- [card-scoring](../../features/card-scoring.md) (only via the athletes assigned here)

## State / Behavior

- All `useState`
- Codes are generated when the round is saved (or regenerated per-official)

## TODOs

- API integration
- Prevent duplicate code generation
- Print-friendly handout listing each official's code
- Validate uniqueness of bibs within the round
