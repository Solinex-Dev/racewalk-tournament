# Admin · Settings

**Route**: `/admin/settings`
**Role**: [admin](../../personas/admin.md)
**Type**: Server Component
**Code**: [app/admin/(pages)/settings/page.tsx](../../../app/admin/(pages)/settings/page.tsx)

## Purpose

System-wide configuration. Currently a placeholder.

## Planned settings

- Language default (`th` / `en`)
- Theme (locked to light for now — see [architecture/overview.md](../../architecture/overview.md))
- Card limits override (typically locked to the federation defaults)
- Time format
- Federation-specific report layout choice

## Features Surfaced

None directly. Sets defaults that other features consume.

## TODOs

- Define which settings are actually editable vs. fixed by rules
- Decide whether settings live per-installation or per-event
