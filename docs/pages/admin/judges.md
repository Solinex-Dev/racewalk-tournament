# Admin · Judges (List / New / Edit)

**Routes**:
- `/admin/judges`
- `/admin/judges/new`
- `/admin/judges/[judgeId]`

**Role**: [admin](../../personas/admin.md)
**Type**: Server pages, Client `JudgeForm`
**Code**:
- [app/admin/(pages)/judges/page.tsx](../../../app/admin/(pages)/judges/page.tsx)
- [app/admin/(pages)/judges/new/page.tsx](../../../app/admin/(pages)/judges/new/page.tsx)
- [app/admin/(pages)/judges/[judgeId]/page.tsx](../../../app/admin/(pages)/judges/[judgeId]/page.tsx)
- [components/judges/judge-form.tsx](../../../components/judges/judge-form.tsx)

## Purpose

CRUD for the pool of people who can serve as officials (judge, head judge, event logger, timekeeper). Position is **not stored here** — it is assigned per round.

## UI Sections

**List**: name and per-row edit.
**Form**: name, contact, certification (planned).

## Features Surfaced

- [judge-mgmt](../../features/judge-mgmt.md) (primary)

## TODOs

- Certification tracking
- Availability calendar
- Contact info fields
