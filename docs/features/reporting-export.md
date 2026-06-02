# Reporting & Export

**Status**: UI only (mock data)
**Roles**: [admin](../personas/admin.md)
**Routes**: `/admin/events/[eventId]/report`, export modal on `/admin/events/[eventId]/moderator`
**Entities**: Aggregated event results
**Related features**: [event-management](event-management.md), [live-scoreboard](live-scoreboard.md)

## Overview

After (or during) an event, admins generate the official report — final positions, times, card history, DQ list — and export it.

## Where to export from

- **Events list** — a Report Export action per row
- **Event report page** — `/admin/events/[eventId]/report`
- **Moderator page** — an export modal with options for which round(s) to include

## Export options (planned)

- File format: CSV / XLSX / PDF
- Scope: full event / one round
- Sections: results, card history, activity log
- Include DNF/DQ rows: yes/no

Currently all of these are UI-only — clicking export shows a mock modal.

## Pages

- [Event report](../pages/admin/event-report.md)
- [Events list](../pages/admin/events-list.md)
- [Moderator](../pages/admin/moderator.md)

## TODOs before production

- Pick the actual export libraries (e.g. `xlsx`, `pdfkit`)
- Decide the official report layout for the federation
- Per-athlete certificate generation?
- Sign reports cryptographically?
