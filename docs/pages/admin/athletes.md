# Admin · Athletes (List / New / Edit)

**Routes**:
- `/admin/athletes` (list)
- `/admin/athletes/new` (create)
- `/admin/athletes/[athleteId]` (edit)

**Role**: [admin](../../personas/admin.md)
**Type**: Server pages, Client `AthleteForm`
**Code**:
- [app/admin/(pages)/athletes/page.tsx](../../../app/admin/(pages)/athletes/page.tsx)
- [app/admin/(pages)/athletes/new/page.tsx](../../../app/admin/(pages)/athletes/new/page.tsx)
- [app/admin/(pages)/athletes/[athleteId]/page.tsx](../../../app/admin/(pages)/athletes/[athleteId]/page.tsx)
- [components/athletes/athlete-form.tsx](../../../components/athletes/athlete-form.tsx)
- [components/athletes/athletes-list.tsx](../../../components/athletes/athletes-list.tsx)

## Purpose

CRUD for the athlete pool — competitors that can be assigned into rounds.

## UI Sections

**List**:
- Table: name, bib, affiliation, country
- New button → `/admin/athletes/new`
- Per-row edit link

**Form (new/edit)**:
- Name, bib, country, affiliation reference

## Actions

- Create / edit / delete athlete (delete is mock)
- On submit: mock `console.log` / `alert`

## Features Surfaced

- [athlete-affiliation-mgmt](../../features/athlete-affiliation-mgmt.md) (primary)

## TODOs

- Bib uniqueness
- Photo upload
- CSV bulk import
