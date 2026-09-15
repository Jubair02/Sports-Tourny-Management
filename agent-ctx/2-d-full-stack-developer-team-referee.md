# Task 2-d — Team Manager + Referee dashboards

Working files for this task live in:
- `src/app/team/**` (pages)
- `src/app/referee/**` (pages)
- `src/app/api/team/**` (API routes)
- `src/app/api/referee/**` (API routes)
- `src/components/team/**` (client components)
- `src/components/referee/**` (client components)

Shared infra reused (NOT edited):
- `@/lib/auth`, `@/lib/constants`, `@/lib/queries`, `@/lib/helpers`, `@/lib/nav`, `@/lib/db`
- `@/components/dashboard/dashboard-shell`
- `@/components/shared/*` (page-elements, status-badge, sport-badge, logo)

Demo logins:
- Team Manager: `rahim@dhakawarriors.bd` / `manage123`
- Referee: `ref.rahman@tourney.bd` / `refer123`

Key business rule enforced in submit API: referee result → `resultStatus=SUBMITTED` only, match.status=COMPLETED, never APPROVED (organizer must approve).

## Progress
- [ ] Layouts (team + referee)
- [ ] Team Manager overview + 9 module pages
- [ ] Referee overview + 4 module pages
- [ ] Team API routes
- [ ] Referee API routes
- [ ] Client components (dialogs + submit-result-form)
- [ ] Lint + worklog

## Done
- All Team Manager dashboard pages + APIs (verified end-to-end with curl).
- All Referee dashboard pages + APIs (verified end-to-end with curl).
- Submit-result-form client component handles football events builder + cricket innings, sets match.status=COMPLETED + resultStatus=SUBMITTED (never APPROVED).
- Lint: my files all clean. Remaining 4 errors live in shared `dashboard-shell.tsx` + `site-header.tsx` (forbidden to edit, pre-existing per worklog).
- Referee submit → organizer approve flow confirmed working end-to-end.
