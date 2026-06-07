# Admin · Event Report

**Route**: `/admin/events/[eventId]/report`
**Role**: [admin](../../personas/admin.md)
**Type**: Server Component wrapping Client `ReportDownloads`
**Status**: Implemented
**Code**:
- [app/admin/(pages)/events/[eventId]/report/page.tsx](../../../app/admin/(pages)/events/[eventId]/report/page.tsx)
- [components/report/report-downloads.tsx](../../../components/report/report-downloads.tsx)
- [app/api/events/[eventId]/summary-xlsx/route.ts](../../../app/api/events/[eventId]/summary-xlsx/route.ts) (Excel)
- [app/api/events/[eventId]/export/route.ts](../../../app/api/events/[eventId]/export/route.ts) (CSV)
- [app/admin/(pages)/events/[eventId]/report/summary/page.tsx](../../../app/admin/(pages)/events/[eventId]/report/summary/page.tsx) (PDF/print layout)
- [app/admin/(pages)/events/[eventId]/report/print/page.tsx](../../../app/admin/(pages)/events/[eventId]/report/print/page.tsx) (plain print)

## Purpose

Export trigger for an event's results: federation-style summary sheets and plain result tables, downloadable per finished round or for the whole event.

## UI Sections

1. Event header and back link
2. **Age-group filter** — chips derived from athlete BIBs (`bibAgeStart`/`ageGroupLabel`); selecting bands narrows every download to those age groups
3. **Race Walking Judges Summary Sheet** — Excel (`.xlsx`, one sheet per round) and a print/PDF layout; shows yellow/red cards per zone, DQs, finish times
4. **Per-round downloads** — Excel / PDF / CSV for each round; only `FINISHED` rounds are exportable, others show a locked "ยังแข่งไม่เสร็จ" chip
5. **Plain results table** — whole-event CSV and a simple print view

## Data Displayed

The Server Component queries Prisma for the event with its rounds (`_count` of round athletes + finish times) and the event's `eventAthletes` BIBs. Each round carries a `statusLabel`, an `exportable` flag (`status === "FINISHED"`), athlete/finish counts, and an elapsed-time label from `endedAt - startedAt`. Access is gated by `getCurrentAdmin()` + `hasPermission(me, "reports", "view")`; missing permission renders `<NoAccess />`. The actual report rows are generated inside the export routes from live Prisma data.

## Actions

- Download Excel (`/api/events/[eventId]/summary-xlsx`, built with `exceljs`)
- Download CSV (`/api/events/[eventId]/export`)
- Print / save PDF (`/report/summary` print page, opened in a new tab — use the browser's print-to-PDF)
- Plain print table (`/report/print`)
- All download links carry the selected `?round=` and `?ageGroups=` query params

## Features Surfaced

- [reporting-export](../../features/reporting-export.md) (primary)

## TODOs

- Per-athlete certificate output
