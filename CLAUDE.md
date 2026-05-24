# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run lint     # ESLint check
```

No test runner is configured. There is no `npm test` command.

## Architecture

### Tech Stack
- **Next.js 16** with App Router (`app/` directory)
- **TypeScript** (strict mode), path alias `@/*` → project root
- **Tailwind CSS v4** with `tw-animate-css`
- **shadcn/ui** (Radix UI primitives) in `components/ui/`
- **Framer Motion** for animation
- **input-otp** for the 6-character secret code entry

### Route Structure & Role Separation

The app has five non-admin user roles plus an admin panel, each with its own route tree:

| Role | Route prefix | Theme |
|------|-------------|-------|
| Admin | `/admin/(pages)/` | Light (slate-50 bg, sidebar layout) |
| Judge | `/judge/events/[eventId]/` | Dark (slate-950 bg) |
| Head Judge | `/head-judge/events/[eventId]/` | Dark |
| Event Logger | `/event-logger/events/[eventId]/` | Dark |
| Timekeeper | `/timekeeper/events/[eventId]/` | Dark |
| Public scoreboard | `/events/[eventId]` | Dark |

Each non-admin role has two pages: a **join page** (`/join`) and a **workspace page**. The join page takes a 6-character alphanumeric secret code (`round_secret_code`) that the Admin generates per judge per round.

Admin panel routes are inside a route group `(pages)` with a shared `layout.tsx` that renders `DashboardSidebar` (`components/partials/admin-sidebar/`). Admin auth is at `(auth)/login`.

### Data Flow (Current State)

**All data is currently mocked.** Look for `MOCK_*` constants defined inline in page files. Key locations:
- `app/admin/(pages)/events/[eventId]/moderator/page.tsx` — `MOCK_EVENT_STATUS`, `MOCK_ATHLETES_BY_ROUND`, `MOCK_JUDGES_BY_ROUND`, `MOCK_ACTIVITY_LOGS`
- `app/events/[eventId]/page.tsx` — `MOCK_PUBLIC_EVENT`
- `app/judge/events/[eventId]/page.tsx` — `MOCK_JUDGE_EVENT_INFO`
- `components/judge/judge-workspace.tsx` — `INITIAL_ATHLETES`
- `components/rounds/round-form.tsx` — `MOCK_ATHLETE_OPTIONS`, `MOCK_JUDGE_OPTIONS`

Every form submission currently calls `console.log` + `alert` with "mock" language. All `TODO` comments mark where real API/database calls go. The planned backend is **Prisma + MySQL**.

### Card System (Domain Logic)

The core scoring component is `components/judge/card-matrix.tsx`:
- `MAX_YELLOW = 2` — each judge can issue max 2 yellow cards per athlete (yellow cards are notes, no symbol)
- `MAX_RED = 4` — max 4 red cards total per athlete across all judges (DQ at 4)
- Each judge can give max **1 red card per athlete**
- Red cards have symbols: `~` (ยกเท้า/lifted foot) or `>` (เข่างอ/bent knee)
- `isFromThisJudge` flag on red card details highlights that judge's own card with a yellow ring
- Max yellow/red cards displayed in moderator view scale with number of judges: `maxYellow = judges × 2`, `maxRed = judges × 1`

### Secret Code Generation

`components/rounds/round-form.tsx` contains `generateRoundSecretCode()` — 6 chars from charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no ambiguous chars I/O/0/1). Each judge in a round gets a unique `round_secret_code`. Head Judge and Event Logger also get separate codes.

### Component Conventions
- Client components use `"use client"` at the top; most page components are Server Components
- `params` in Next.js 16 is a `Promise<{...}>` — unwrap with `await props.params` (server) or `use(props.params)` (client)
- Forms are fully controlled with local `useState`, no form library
- No global state management; no React Context in use
- `lib/utils.ts` exports `cn()` (clsx + tailwind-merge)
