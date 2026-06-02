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

## Pending decisions (no ADR yet)

These are open questions called out across the docs. Each will become an ADR when decided:

- **Real-time sync mechanism**: polling vs. SSE vs. WebSocket vs. managed (Pusher/Ably). See [../architecture/state-and-data-flow.md](../architecture/state-and-data-flow.md).
- **Pending vs. confirmed red card semantics**: does a pending red card count toward DQ before head judge confirms? See [../product/domain-rules.md](../product/domain-rules.md).
- **Bib uniqueness scope**: per event, per season, or global? See [../architecture/data-model.md](../architecture/data-model.md).
- **Admin permission model**: RBAC enum vs. flag-based, and exact owner/manager/officer matrix. See [../features/admin-mgmt.md](../features/admin-mgmt.md).
- **Server actions vs. route handlers for writes**: which pattern dominates the admin CRUD vs. live workspace writes. See [../architecture/state-and-data-flow.md](../architecture/state-and-data-flow.md).
- **Code storage**: hash secret codes (security) or store plain (admin re-display). See [../features/secret-code-access.md](../features/secret-code-access.md).
- **Export format(s)**: CSV / XLSX / PDF; which libraries. See [../features/reporting-export.md](../features/reporting-export.md).
