# Admin · Moderator Edit

**Route**: `/admin/events/[eventId]/moderator/edit`
**Role**: [admin](../../personas/admin.md)
**Type**: Server page with form
**Code**: [app/admin/(pages)/events/[eventId]/moderator/edit/page.tsx](../../../app/admin/(pages)/events/[eventId]/moderator/edit/page.tsx)

## Purpose

Edit the moderator-side configuration of an event: which judges are assigned, in what positions, with which secret codes.

## UI Sections

- Judges list (selected from the pool — see [judge-mgmt](../../features/judge-mgmt.md))
- Position assignment per judge
- Code display / regenerate

## Data Displayed

Pulls from the same sources as [moderator.md](moderator.md), in editable form.

## Actions

- Add / remove judges from the round
- Change a judge's position
- Regenerate a single code

## Features Surfaced

- [round-configuration](../../features/round-configuration.md) (primary)
- [secret-code-access](../../features/secret-code-access.md) (issue/regenerate)

## TODOs

- This page overlaps with [round-form.md](round-form.md); decide single source of truth
- Confirm before regenerating a code (current code becomes invalid)
