# Admin · Event Report

**Route**: `/admin/events/[eventId]/report`
**Role**: [admin](../../personas/admin.md)
**Type**: Server Component
**Code**: [app/admin/(pages)/events/[eventId]/report/page.tsx](../../../app/admin/(pages)/events/[eventId]/report/page.tsx)

## Purpose

Final-results view and export trigger for an event.

## UI Sections

1. Event header and final status
2. Per-round results tables (positions, times, status)
3. DQ list with card history per disqualified athlete
4. Export buttons (CSV / XLSX / PDF — currently mock)

## Data Displayed

Aggregated end-of-event data. Sources reuse mocks from the public scoreboard and moderator views.

## Actions

- Export
- Print (browser print stylesheet — not yet implemented)

## Features Surfaced

- [reporting-export](../../features/reporting-export.md) (primary)

## TODOs

- Pick export libraries (`xlsx`, `pdfkit`)
- Federation-approved layout
- Per-athlete certificate
- Print stylesheet
