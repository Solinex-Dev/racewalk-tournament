# Judge · Workspace

**Route**: `/judge/events/[eventId]`
**Role**: [judge](../../personas/judge.md)
**Type**: Server page wrapping Client `JudgeWorkspace`
**Code**:
- [app/judge/events/[eventId]/page.tsx](../../../app/judge/events/[eventId]/page.tsx)
- [components/judge/judge-workspace.tsx](../../../components/judge/judge-workspace.tsx)

## Purpose

Main interface for a judge during a round. Shows the athlete list and provides one-tap card-issuing buttons.

## UI Sections

1. **Event/round header** — name, heat, status
2. **Athlete list** — one row per athlete, showing:
   - Bib, name, status
   - Yellow card matrix (`yellowKnee`, `yellowFoot`)
   - Red card matrix
3. **Sticky action bar** — appears when an athlete is selected. Four buttons:
   - ใบเตือน งอเข่า (yellow, knee `>`)
   - ใบเตือน ยกเท้า (yellow, foot `~`)
   - ใบแดง งอเข่า (red, knee `>`)
   - ใบแดง ยกเท้า (red, foot `~`)

## Data Displayed

Source: `INITIAL_ATHLETES: JudgeAthleteRow[]` in `judge-workspace.tsx` — 5 sample athletes (Bib 01–05).

```typescript
JudgeAthleteRow {
  bib, status, yellowKnee, yellowFoot, red,
  redDetails?: { symbol: "~" | ">", isFromThisJudge? }[],
  judgeRedCount?
}
```

## Actions

- Click row → select athlete (highlights row, shows action bar)
- `handleYellowKnee()` — disabled if `yellowKnee === true`
- `handleYellowFoot()` — disabled if `yellowFoot === true`
- `handleRedCard()` — disabled if `judgeRedCount >= 1`
- Red card pushes athlete to `DQ` if total `red === 4` after this card

## Features Surfaced

- [card-scoring](../../features/card-scoring.md) (primary, issuing side)

## State / Behavior

- Pure local `useState` — no sync to other judges yet
- Per-judge limits enforced via button disabled state
- Aggregate DQ computed from `red` field

## TODOs

- Sync cards across judges (this is the critical real-time feature)
- Confirm-on-tap to prevent accidental card
- Undo last card (matching timekeeper UX)
