# Head Judge · Workspace

**Route**: `/head-judge/events/[eventId]`
**Role**: [head-judge](../../personas/head-judge.md)
**Type**: Client Component
**Code**: [app/head-judge/events/[eventId]/page.tsx](../../../app/head-judge/events/[eventId]/page.tsx)

## Purpose

Oversight dashboard for the head judge. Shows all athletes' card state across all judges, the judging panel, and the activity log. Provides confirm/override actions on red cards.

## UI Sections

1. **Event header** — name, heat, status
2. **Round selector** — switch between rounds in this event
3. **Athletes panel** — table with aggregate cards from every judge:
   - Bib, name, affiliation, country
   - Yellow card totals + symbols
   - Red card totals + symbols
   - Status (`OK` / `DQ` / `DNF`)
   - Position (computed)
   - Click row → expand to show per-card detail history
4. **Judges panel** — for the selected round:
   - Each judge's name, position, zone
5. **Activity log** — append-only timeline of all actions in the round
6. **Pending red cards** — actionable when `canOverride: true`:
   - "ยืนยัน" (confirm) → `handleConfirmRedCard()` → `alert("ยืนยันใบแดงเรียบร้อย (mock)")`
   - "ยกเลิก" (override) → `confirm()` then `handleOverrideRedCard()` → `alert("ยกเลิกใบแดงเรียบร้อย (mock)")`

## Data Displayed

Sources (mock):
- `MOCK_EVENT_STATUS` — event metadata, rounds
- `MOCK_ATHLETES_BY_ROUND` — athletes per round with card details
- `MOCK_JUDGES_BY_ROUND` — judges assigned to each round
- `MOCK_ACTIVITY_LOGS` — log entries

## Actions

- Switch round
- Expand/collapse an athlete row
- Confirm a pending red card
- Override (cancel) a red card with a JS `confirm()` first

## Features Surfaced

- [card-scoring](../../features/card-scoring.md) (confirm/override side)
- [event-logging](../../features/event-logging.md) (read-only view of log)

## State / Behavior

- Client component — all `useState`
- The log is the single timeline; pending cards are a filtered view of the log

## TODOs

- Real-time sync — head judge must see cards as judges issue them
- Persist confirm/override decisions
- Audit who confirmed/overrode each card
