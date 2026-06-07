# Judge · Workspace

**Route**: `/judge/events/[eventId]`
**Role**: [judge](../../personas/judge.md)
**Type**: Server page wrapping Client `JudgeWorkspace`
**Status**: Implemented
**Code**:
- [app/judge/events/[eventId]/page.tsx](../../../app/judge/events/[eventId]/page.tsx)
- [components/judge/judge-workspace.tsx](../../../components/judge/judge-workspace.tsx)
- [app/actions/cards.ts](../../../app/actions/cards.ts) — `issueYellowCard`, `issueRedCard`

## Purpose

Main interface for a judge during a round. Shows the round's start-list and provides one-tap card-issuing buttons that write real cards through Server Actions.

## UI Sections

1. **Event/round header** — event name, round name, distance (metres), `currentLap / lapCount`, judge name + zone, links to scoreboard and logout
2. **Race status banner** — derived from `roundStatus` (not-started / live / ended)
3. **Athlete list** — one row per athlete (start-list order), showing:
   - Bib, status (OK / DQ / เข้าเส้นชัย)
   - This judge's own yellow card slots (`myYellowKnee` `>`, `myYellowFoot` `~`)
   - This judge's own red card slot (`myRedSymbol`)
4. **Sticky action bar** — appears when an athlete is selected. Four buttons:
   - ใบเหลือง งอเข่า (yellow, knee `>`, `BENT_KNEE`)
   - ใบเหลือง ยกเท้า (yellow, foot `~`, `LIFTED_FOOT`)
   - ใบแดง งอเข่า (red, knee `>`)
   - ใบแดง ยกเท้า (red, foot `~`)

## Data Displayed

The Server Component requires a valid official session cookie (`getOfficialSession()`, position `JUDGE` or `HEAD_JUDGE`, matching `eventId`) and queries Prisma for the round, its `roundAthletes` (start-list order), `cards`, `finishTimes`, and the event's `eventAthletes` for BIB lookup. It projects each athlete into a `JudgeAthleteRow`:

```typescript
JudgeAthleteRow {
  bib, athleteId, name,
  status: "OK" | "DQ" | "DNF",
  isFinished: boolean,
  myYellowKnee: boolean,   // this judge's BENT_KNEE yellow
  myYellowFoot: boolean,   // this judge's LIFTED_FOOT yellow
  myRedSymbol: "~" | ">" | null,  // this judge's own (non-overridden) red
  totalRed: number          // confirmed reds across all judges
}
```

The row matrix shows only **this judge's** cards (yellow/red are scoped per judge); aggregate/confirmation views live on the head-judge workspace.

## Actions

- Click row → select athlete (highlights row, shows action bar)
- `handleYellow(athleteId, symbol)` → `issueYellowCard` Server Action → toast + `router.refresh()`. Disabled once that symbol is already given by this judge (`myYellowKnee` / `myYellowFoot`), or when locked.
- `handleRed(athleteId, symbol)` → `issueRedCard` Server Action (creates a `PENDING` red awaiting head-judge confirmation) → toast + `router.refresh()`. Both red buttons disable once this judge has issued any red (`hasGivenSelected`).
- Buttons are also locked when the round is not `ONGOING` (`isRoundLive`), or the athlete is DQ or already finished (`isLockedSelected`). A status note explains why.
- Logout → `logoutOfficial()` clears the cookie and returns to the join page.

Card rules (enforced server-side in `app/actions/cards.ts`): max 1 yellow per symbol per judge per athlete (so 2 yellow max per judge, `MAX_YELLOW`), max 1 red per judge per athlete; the round must be `ONGOING` and the athlete active and not finished. Yellow cards are immediate notes; red cards are `PENDING` until the head judge confirms. DQ at 4 confirmed reds (`RED_CARDS_TO_DQ`) is computed on confirmation, not here.

## Features Surfaced

- [card-scoring](../../features/card-scoring.md) (primary, issuing side)

## State / Behavior

- Server-rendered rows from Prisma; the client component holds only the selected bib and a `useTransition` pending flag.
- Per-judge card limits enforced both by button disabled state and by the Server Action.
- Cross-judge aggregation and DQ are computed server-side and reflected on the next refresh.
- **Real-time:** `AutoRefresh` calls `router.refresh()` every 2000ms while the round is `SCHEDULED`, 2500ms otherwise, so other judges' cards and confirmations appear automatically. An `OfficialEndedDialog` opens when the round is `FINISHED`.

## TODOs

- Confirm-on-tap to prevent an accidental card (currently a single tap issues immediately, mitigated by the per-symbol/per-judge limits)
