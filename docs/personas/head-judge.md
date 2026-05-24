# Head Judge

**Auth**: 6-character secret code (per round, issued by admin)
**Route prefix**: `/head-judge/events/[eventId]/...`
**Theme**: Dark

## What a head judge does

- Oversees the panel of judges during a round
- Confirms or overrides red cards before they count toward DQ
- Monitors the activity log to spot anomalies

A head judge does **not** issue cards themselves in the system today (their role is moderation, not first-line judging). This may change — see [decisions/](../decisions/).

## Features used

| Feature | Notes |
|---------|-------|
| [secret-code-access](../features/secret-code-access.md) | Join via code |
| [card-scoring](../features/card-scoring.md) | Confirm / override |
| [event-logging](../features/event-logging.md) | View timeline |
| [live-scoreboard](../features/live-scoreboard.md) | Cross-reference public view |

## Pages visited

- [Join](../pages/head-judge/join.md)
- [Workspace](../pages/head-judge/workspace.md)

## Typical workflow

1. Receive code from admin; open `/head-judge/events/[eventId]/join`.
2. Enter code → land on workspace.
3. Watch the athlete table and activity log as judges issue cards.
4. When a red card needs review, click Confirm or Override.
5. After the round, the workspace becomes read-only history.
