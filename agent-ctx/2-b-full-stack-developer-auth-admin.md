# Task 2-b — Auth + Admin Dashboard

## Status: COMPLETE

## What was built
- **Auth pages**: `/login`, `/register` (server) + `LoginForm` / `RegisterForm` (client)
- **Admin layout** (`/admin/layout.tsx`): getSession → role check → AdminShell → DashboardShell
- **Admin dashboard** (`/admin`): 10 KPI StatCards + 2 recharts (bar/donut) + PendingApprovalsPanel + Recent Activity
- **10 admin modules**: users, tournaments, teams, matches, venues, disputes, announcements, audit-logs, reports, settings
- **12 admin API routes** under `/api/admin/...` (all guarded by `apiRequireRole(ROLES.ADMIN)`)

## Bugs found and fixed during this run
1. `/admin/disputes` 500 — Dispute model has NO `tournament`/`match` relations in schema (only plain `tournamentId`/`matchId` String? columns). Fixed by fetching disputes first, then resolving tournaments/matches via separate findMany + JS map join. Same fix applied to `GET /api/admin/disputes`.
2. `PATCH /api/admin/disputes/[id]` — removed bogus `tournament: true` include.
3. `/admin/reports` 500 — `db.tournamentRegistration.aggregate({ _sum: {} })` rejected by Prisma. Replaced with `findMany` + JS sum (result was already used that way; aggregate was dead code).

## Verification (all passed)
- All 11 admin pages return HTTP 200 as ADMIN
- All admin routes redirect (307) to `/login?next=/admin&reason=forbidden` for non-admin sessions
- Login redirect works: already-logged-in users visiting `/login` → role dashboard
- Registration: new organizer appears as PENDING in admin dashboard "Pending Approvals"
- Mutation APIs verified: approve organizer, change tournament status, update dispute, create venue, create announcement, suspend user — all return 200 + create audit log + notification

## Lint
- `bunx eslint src/app/admin src/components/admin src/components/auth 'src/app/(public)/login' 'src/app/(public)/register' src/app/api/admin` → exit 0
- 4 remaining `bun run lint` errors are in shared foundation files (`dashboard-shell.tsx`, `site-header.tsx`) which I'm forbidden to edit per task instructions.

## Demo logins (already working)
- Admin: `admin@tourney.bd` / `admin123`
- Organizer (approved): `jubair@mirpursports.bd` / `organ123`
- Team Manager: `rahim@dhakawarriors.bd` / `manage123`
- Referee: `ref.rahman@tourney.bd` / `refer123`

## Important note for downstream agents
The `Dispute` model in `prisma/schema.prisma` has `tournamentId String?` and `matchId String?` columns but NO relation fields. Reference implementation for resolving related entities: see `src/app/admin/disputes/page.tsx` and `src/app/api/admin/disputes/route.ts`.
