# Task 2-c — Organizer dashboard

Working files for this task live in:
- `src/app/organizer/**` (pages)
- `src/app/api/organizer/**` (API routes)
- `src/components/organizer/**` (client components)
- `src/lib/api-guard.ts` (shared organizer ownership guard — new shared util)

Shared infra reused (NOT edited):
- `@/lib/auth`, `@/lib/constants`, `@/lib/queries`, `@/lib/helpers`, `@/lib/nav`, `@/lib/db`, `@/lib/standings`
- `@/components/dashboard/dashboard-shell`
- `@/components/shared/*` (page-elements, status-badge, sport-badge, logo)
- `@/components/ui/*` shadcn

## Demo logins (from worklog)
- Organizer (approved): `jubair@mirpursports.bd` / `organ123`
- Admin: `admin@tourney.bd` / `admin123`

## Golden path verified end-to-end (2026-09-14)
1. Organizer creates tournament via POST `/api/organizer/tournaments` → status DRAFT
2. Status workflow: DRAFT → PENDING_APPROVAL (organizer Submit for Approval)
3. Admin externally approves via POST `/api/admin/tournaments/{id}/status` → PUBLISHED → REGISTRATION_OPEN
4. 3 team managers register via POST `/api/team/register`
5. Organizer approves registrations via PATCH `/api/organizer/tournaments/{id}/registrations/{regId}` → creates TournamentParticipant rows
6. Organizer generates fixtures via POST `/api/organizer/tournaments/{id}/fixtures/generate` → 3 round-robin matches, status → REGISTRATION_CLOSED
7. Organizer assigns referee via POST `/api/organizer/tournaments/{id}/matches/{matchId}/assign-referee`
8. Tournament → ONGOING
9. Referee submits result via POST `/api/referee/matches/{id}/submit` → match.status=COMPLETED, resultStatus=SUBMITTED (NOT APPROVED)
10. Organizer approves via POST `/api/organizer/tournaments/{id}/matches/{matchId}/result` → resultStatus=APPROVED, `recalcStandings(tournamentId)` called
11. Standings updated: API Test Team (3 pts, W1 D0 L0, GF3 GA1), Uttara United (0 pts), Dhaka Warriors (0 pts)

Also tested:
- Status workflow: invalid transition rejected with proper error
- Generate fixtures when tournament status is ONGOING → rejected
- Generate fixtures with insufficient approved teams → rejected
- Result REJECT → resultStatus=REJECTED, referee notified
- Announcement create → persisted + recipients notified

## Files created (no shared foundation files modified)
- `src/lib/api-guard.ts` — `ensureOrganizerOfTournament`, `getOrganizerContext`
- `src/components/organizer/organizer-shell.tsx` — client wrapper (NAV_CONFIG.ORGANIZER → DashboardShell)
- `src/components/organizer/reg-actions-button.tsx` — Approve/Reject/UnderReview actions
- `src/components/organizer/tournament-form-dialog.tsx` — Create Tournament dialog
- `src/components/organizer/generate-fixtures-button.tsx` — confirmation + generate
- `src/components/organizer/edit-match-dialog.tsx` — edit date/venue/round
- `src/components/organizer/assign-referee-dialog.tsx` — assign referee to match
- `src/components/organizer/result-actions-button.tsx` — Approve/Reject submitted results
- `src/components/organizer/status-workflow-actions.tsx` — status transition buttons
- `src/components/organizer/announcement-form.tsx` — create/delete announcements
- `src/components/organizer/tournament-settings-form.tsx` — full edit form

Pages:
- `src/app/organizer/layout.tsx` — auth + OrganizerShell
- `src/app/organizer/page.tsx` — overview (8 KPIs, pending regs, upcoming matches)
- `src/app/organizer/tournaments/page.tsx` — list + filters
- `src/app/organizer/tournaments/[id]/page.tsx` — detail overview (status stepper + nav cards + info)
- `src/app/organizer/tournaments/[id]/registrations/page.tsx` — registration dashboard
- `src/app/organizer/tournaments/[id]/fixtures/page.tsx` — fixture management
- `src/app/organizer/tournaments/[id]/matches/page.tsx` — all matches table
- `src/app/organizer/tournaments/[id]/results/page.tsx` — submitted/approved/rejected results
- `src/app/organizer/tournaments/[id]/standings/page.tsx` — points table
- `src/app/organizer/tournaments/[id]/teams/page.tsx` — approved teams grid
- `src/app/organizer/tournaments/[id]/referees/page.tsx` — directory + assignment
- `src/app/organizer/tournaments/[id]/venues/page.tsx` — venue list + matches
- `src/app/organizer/tournaments/[id]/announcements/page.tsx` — create/list
- `src/app/organizer/tournaments/[id]/settings/page.tsx` — edit + status workflow
- `src/app/organizer/registrations/page.tsx` — cross-tournament registrations
- `src/app/organizer/teams/page.tsx` — cross-tournament teams
- `src/app/organizer/fixtures/page.tsx` — upcoming across tournaments
- `src/app/organizer/matches/page.tsx` — all matches
- `src/app/organizer/results/page.tsx` — pending results across tournaments
- `src/app/organizer/referees/page.tsx` — referee directory
- `src/app/organizer/venues/page.tsx` — venues grid
- `src/app/organizer/announcements/page.tsx` — cross-tournament announcements
- `src/app/organizer/disputes/page.tsx` — disputes (manual tournament/match join)
- `src/app/organizer/settings/page.tsx` — organizer profile + approval status

API routes:
- `src/app/api/organizer/tournaments/route.ts` (GET own + POST create with approval guard + slug uniqueness)
- `src/app/api/organizer/tournaments/[id]/route.ts` (GET detail + PATCH update)
- `src/app/api/organizer/tournaments/[id]/status/route.ts` (POST status transitions + notify + audit)
- `src/app/api/organizer/tournaments/[id]/registrations/route.ts` (GET with counts)
- `src/app/api/organizer/tournaments/[id]/registrations/[regId]/route.ts` (PATCH approve/reject/under_review; APPROVED creates TournamentParticipant)
- `src/app/api/organizer/tournaments/[id]/fixtures/generate/route.ts` (POST — uses lib/standings generators)
- `src/app/api/organizer/tournaments/[id]/matches/[matchId]/route.ts` (PATCH edit date/venue/round/status)
- `src/app/api/organizer/tournaments/[id]/matches/[matchId]/assign-referee/route.ts` (POST upsert assignment + notify)
- `src/app/api/organizer/tournaments/[id]/matches/[matchId]/result/route.ts` (POST approve → recalcStandings / reject → notify referee)
- `src/app/api/organizer/tournaments/[id]/announcements/route.ts` (POST create + notify approved team managers)
- `src/app/api/organizer/tournaments/[id]/announcements/[annId]/route.ts` (DELETE)

## Lint
`bunx eslint src/app/organizer src/app/api/organizer src/components/organizer src/lib/api-guard.ts` exits 0 (zero errors).
The 4 remaining `bun run lint` errors are all in shared foundation files (`dashboard-shell.tsx`, `site-header.tsx`) which I'm not allowed to edit.

## Business rules enforced
1. Only APPROVED organizers can create tournaments (organizer must have OrganizerProfile.approvalStatus === "APPROVED")
2. Tournament cannot go ONGOING until approved teams (TournamentParticipant count) >= minTeams
3. Team can't participate until registration APPROVED (creates TournamentParticipant via upsert)
4. Only assigned referees submit results (referee API in 2-d — unchanged)
5. Referee results are SUBMITTED, not official
6. Organizer must approve result via POST /api/organizer/tournaments/{id}/matches/{matchId}/result
7. Only APPROVED results affect standings — calls recalcStandings(tournamentId) on approval
8. Editing an already-approved result requires re-submission (referee API rejects re-submit on APPROVED; organizer rejects SUBMITTED to push it back to REJECTED → referee re-submits)
9. Every status change → logAudit + notify (organizer, team managers, referee as appropriate)
10. Public users see tournament info without login (handled by 2-a's public routes — unchanged)

## Notes / decisions
- **Dispute model has no relations** — confirmed from worklog 2-b. The `/organizer/disputes/page.tsx` fetches disputes first then resolves tournament names from the organizer's own tournaments list (already-known IDs), and match names via separate `db.match.findMany({ where: { id: { in: matchIds } } })` — same pattern as admin/disputes.
- **OrganizerShell client wrapper** mirrors `AdminShell`/`TeamShell`/`RefereeShell` to avoid serializing lucide icons across the server/client boundary.
- **ADMIN oversight**: `ensureOrganizerOfTournament` short-circuits ownership checks for ADMIN role (returns success without checking organizerId). Cross-tournament list pages fall back to "first APPROVED organizer profile" for ADMIN preview.
- **Status transitions**: Organizer can only move forward through the lifecycle. Allowed transitions are defined in `ORGANIZER_TRANSITIONS` in `/api/organizer/tournaments/[id]/status/route.ts`. ADMIN can force any transition (uses admin status API).
- **Match referee access path**: `match.assignment?.referee?.user?.name` — same pattern as 2-d and admin.
