# Reporting & Export

**Status**: Implemented
**Roles**: [admin](../personas/admin.md) (`reports:view`)
**Routes**: `/admin/events/[eventId]/report`, `/admin/events/[eventId]/report/summary`, `/admin/events/[eventId]/report/print`
**Entities**: Aggregated event results (read-only, from `Round` / `RoundAthlete` / `Card` / `FinishTime`)
**Code**: [app/admin/(pages)/events/[eventId]/report/page.tsx](../../app/admin/(pages)/events/[eventId]/report/page.tsx), [components/report/report-downloads.tsx](../../components/report/report-downloads.tsx), [app/api/events/[eventId]/export/route.ts](../../app/api/events/[eventId]/export/route.ts), [app/api/events/[eventId]/summary-xlsx/route.ts](../../app/api/events/[eventId]/summary-xlsx/route.ts)
**Related features**: [event-management](event-management.md), [live-scoreboard](live-scoreboard.md)

## Overview

After (or during) an event, admins generate the official report — final positions, times, card history, DQ list — and export it. All export entry points require the `reports:view` permission (`hasPermission(me, "reports", "view")`); the report page renders `<NoAccess />` otherwise.

**Only `FINISHED` rounds are exportable.** Whole-event exports cover just the finished rounds; per-round buttons are locked until that round is finished.

## Where to export from

- **Events list** (`/admin/events`) — a Report action per row (visible to `reports:view` admins).
- **Event report page** (`/admin/events/[eventId]/report`) — the hub, listing each round with its status, athlete/finish counts, and elapsed time, plus an age-group filter.

The report page is a Server Component that reads the event, its rounds (`_count` of athletes/finishes), and the registered BIBs from Prisma, derives the available **age groups** from the BIBs (`lib/bib.ts`), and renders [report-downloads.tsx](../../components/report/report-downloads.tsx).

## Export formats (implemented)

`ReportDownloads` builds download links to real route handlers / print pages. All accept an optional `?round=ID` (single round) and `?ageGroups=` filter:

| Format | Target | Notes |
|--------|--------|-------|
| **Excel (.xlsx)** | `GET /api/events/[eventId]/summary-xlsx` | Official "Race Walking Judges Summary Sheet" — one worksheet per round (built with `exceljs`, Node runtime). |
| **Summary PDF** | `/admin/events/[eventId]/report/summary` (opens in a new tab, print to PDF) | The same judges summary sheet rendered as a printable page. |
| **CSV** | `GET /api/events/[eventId]/export` | Full results table — BIB, age group, name, country, affiliation, status (DQ rule code when present), position, yellow/confirmed-red/pending-red counts, finish time. UTF-8 with BOM so Excel opens Thai correctly. |
| **Plain print** | `/admin/events/[eventId]/report/print` | Simple results table for quick printing. |

The XLSX and CSV endpoints are admin-gated route handlers (`getCurrentAdmin` + `hasPermission(me, "reports", "view")`, returning `403` otherwise) and `404` if the event is missing. They reject export when there are no finished rounds to include.

The card glyphs used throughout: `~` = ยกเท้า (lifted foot, `LIFTED_FOOT`), `>` = เข่างอ (bent knee, `BENT_KNEE`). Only **confirmed** red cards count toward results; pending reds are reported separately in the CSV.

## Reference-data exports

The athlete/judge/affiliation list pages also export their raw reference data to CSV via `app/api/admin/export/{athletes,judges,affiliations}` — separate from event results. See [athlete-affiliation-mgmt](athlete-affiliation-mgmt.md) and [judge-mgmt](judge-mgmt.md).

## Pages

- [Event report](../pages/admin/event-report.md)
- [Events list](../pages/admin/events-list.md)
- [Moderator](../pages/admin/moderator.md)

## TODOs before production

- Confirm the official summary-sheet layout matches the federation's required form.
- Per-athlete certificate generation.
