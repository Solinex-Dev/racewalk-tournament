# Architecture Decision Records (ADRs)

A lightweight record of significant choices that shape this codebase. The format is borrowed from [Michael Nygard's ADR template](https://github.com/joelparkerhenderson/architecture-decision-record).

## Why ADRs

The codebase will outlive memory. When a future maintainer asks "why is X done this way?", an ADR answers — including the alternatives that were considered and rejected, which is the part `git log` never captures.

Write a new ADR when:

- Picking between options that affect more than one feature
- Choosing a library, framework, or external service
- Locking in a domain rule that affects many places
- Reversing a past decision

Do **not** write an ADR for routine code-level choices (variable names, file paths) — those belong in [conventions/](../conventions/).

## Format

Each ADR is numbered and named `NNNN-short-title.md`. Contents:

```markdown
# NNNN. Title

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Superseded by NNNN

## Context
What is the situation? What problem are we solving?

## Decision
What did we decide?

## Alternatives considered
What else was on the table, and why didn't we pick it?

## Consequences
What follows from this decision — positive and negative?
```

## Index

| # | Title | Status |
|---|-------|--------|
| [0001](0001-secret-code-charset.md) | Secret code charset and length | Accepted |

## Decisions now settled in code (ADRs to be backfilled)

Several questions that were once open have since been resolved in the implementation.
They are recorded here until a full ADR is backfilled; the cited source is the
current source of truth:

- **Real-time sync mechanism**: polling, two channels. Official workspaces call
  `router.refresh()` via `AutoRefresh` (2000 ms when the round is SCHEDULED, 2500 ms
  otherwise); the public scoreboard client-polls a CDN-cached JSON route at 5 s.
  See [../architecture/state-and-data-flow.md](../architecture/state-and-data-flow.md)
  and [../../lib/leaderboard.ts](../../lib/leaderboard.ts).
- **Pending vs. confirmed red card semantics**: only **CONFIRMED** reds count toward
  DQ (threshold 4) and appear on the public board; a head judge confirms or overrides.
  See [../product/domain-rules.md](../product/domain-rules.md) and [../../app/actions/cards.ts](../../app/actions/cards.ts).
- **Bib uniqueness scope**: **per event** — BIB lives on `EventAthlete`, unique per
  `(eventId, bib)`, reused across all rounds in the event. See
  [../architecture/data-model.md](../architecture/data-model.md).
- **Admin permission model**: a resource × action matrix (`permissions Json` on
  `User`) with a `isRoot` bypass; checks enforced by `requirePermission`. See
  [../features/admin-mgmt.md](../features/admin-mgmt.md) and [../../lib/permissions.ts](../../lib/permissions.ts).
- **Server Actions vs. route handlers for writes**: **Server Actions** dominate
  (`app/actions/*`); route handlers are reserved for read endpoints (the cached
  leaderboard JSON, exports) and NextAuth. See
  [../architecture/state-and-data-flow.md](../architecture/state-and-data-flow.md).
- **Code storage**: stored **plain** (admins must re-display codes on printed slips);
  brute-force is mitigated by event-wide uniqueness + a join rate limit. See
  [../features/secret-code-access.md](../features/secret-code-access.md).
- **Export format(s)**: CSV and XLSX (via `exceljs`/`papaparse`) plus a
  print-to-PDF page. See [../features/reporting-export.md](../features/reporting-export.md).
