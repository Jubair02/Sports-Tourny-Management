# Task 2-a — Public website (full-stack-developer, public site)

## Scope
Built the entire public-facing TourneyBD website on top of the foundation from Task 1.
All pages live under `src/app/(public)/...` and reuse the shared layout, SiteHeader,
SiteFooter, helpers, constants, queries, and shared components without modifying
any of them.

## Files created

### Reusable components — `src/components/public/`
- `images.ts` — deterministic Unsplash image pool (sport banners, venue images,
  player avatars, hero image). `pickImage(pool, seed)` helper.
- `tournament-card.tsx` — TournamentCard with banner overlay, sport + status
  badges, organizer / location / dates, entry fee / teams / prize stat row.
- `team-card.tsx` — TeamCard with deterministic gradient logo placeholder,
  district, player count, captain, sport emoji.
- `player-card.tsx` — PlayerCard with photo / initial avatar, position, jersey,
  verification badge.
- `match-card.tsx` — MatchCard with grid layout, status badge, score / "vs",
  matchCode, venue, date/time. Supports `compact` variant and cricket scores.
- `venue-card.tsx` — VenueCard with image, capacity badge, location chip,
  facilities chips, tournaments / matches count.
- `standings-table.tsx` — StandingsTable with positional medals, top-N
  highlight, cricket label swap (RF/RA/Diff).
- `tournament-filters.tsx` — client component for the tournaments listing
  (search + sport/status/category selects that update URL params).
- `tournament-tabs.tsx` — client tab switcher for the 5 tournament sub-routes.
- `tournament-sub-header.tsx` — reusable header (back link + sport/status
  badges + tabs) used by all 4 tournament sub-pages.
- `tournament-filters.tsx` — see above.
- `url-filters.tsx` — generic client `UrlSelectFilter` and `UrlSearchFilter`
  that read/write URL search params. Used by teams, players, fixtures,
  results, rankings.
- `url-tabs.tsx` — generic client `UrlTabs` for tabbed views (used by fixtures).
- `contact-form.tsx` — client contact form that POSTs to
  `/api/public/contact` and shows Sonner toast on success.

### Public pages — `src/app/(public)/`
- `page.tsx` — Home page with 10 sections (hero with bg-grid + Unsplash bg,
  floating stat chips, live-match panel; sport categories row; featured
  tournaments; today's matches; upcoming + recent results two-column;
  rankings + popular teams; how-it-works (3 roles); CTA banner; stats strip).
- `tournaments/page.tsx` — listing with search + sport/status/category
  filters + count + empty state + 12-per-page grid.
- `tournaments/[id]/page.tsx` — overview: banner, sport/status/format/category
  badges, organizer card, venue card, key info grid, rules, announcements,
  approved teams count vs max.
- `tournaments/[id]/fixtures/page.tsx` — scheduled matches grouped by date.
- `tournaments/[id]/standings/page.tsx` — full standings table using
  StandingsTable.
- `tournaments/[id]/teams/page.tsx` — approved teams grid + pending
  registrations panel.
- `tournaments/[id]/matches/page.tsx` — all matches table (code / round /
  teams / date / venue / score / status / result).
- `teams/page.tsx` — listing with search + district filter.
- `teams/[id]/page.tsx` — header with gradient banner + logo, squad table
  (jersey / name / position / verification), registered tournaments sidebar.
- `players/page.tsx` — listing with search + position filter.
- `players/[id]/page.tsx` — profile card with photo/avatar, jersey #,
  position, verification status, NID note (no number shown), team card,
  info grid.
- `fixtures/page.tsx` — Today / Upcoming / All tabs (UrlTabs) + sport
  filter, grouped by date.
- `results/page.tsx` — recent approved results with scoreline cards,
  winner highlight, POTM chip, sport filter.
- `rankings/page.tsx` — podium for top 3 + full table with medals,
  sport filter.
- `venues/page.tsx` — grid of VenueCards.
- `venues/[id]/page.tsx` — image header, capacity/matches/tournaments stats,
  facilities chips, upcoming + recent matches, hosted tournaments sidebar.
- `about/page.tsx` — mission hero, stats, 8 features, 8 sports, Bangladesh
  geography (division tree), 4 roles cards, CTA.
- `contact/page.tsx` — ContactForm, contact info cards, demo logins card
  with all 4 demo accounts.

### API route — `src/app/api/public/contact/route.ts`
- POST handler that validates required fields, logs the submission to the
  server console, and returns `{ ok: true, message }`.

### New helper file — `src/lib/public-queries.ts`
- Mirrors `getTournamentById`, `getTournamentBySlug`, `getFixtures` from
  `@/lib/queries` but fixes a Prisma include bug: the shared layer tries to
  `include: { referee: { include: { user: true } } }` on `Match`, but the
  schema only has `assignment: RefereeAssignment?`. The corrected include
  is `assignment: { include: { referee: { include: { user: true } } } }`.
- Adds `getTeamById` (the shared layer only has `getTeamBySlug`, but the
  route is `[id]`).
- Adds `matchRefereeName` helper to read the referee name off the assignment
  relation.
- Did NOT edit the shared `@/lib/queries.ts` per the task constraint.

## Issues / notes for orchestrator
- **Bug in shared `@/lib/queries.ts`**: `getTournamentById`,
  `getTournamentBySlug`, and `getFixtures` all use an invalid
  `referee: { include: { user: true } }` include on the `Match` model. The
  Prisma schema only has `assignment: RefereeAssignment?` (with
  `assignment.referee.user`). My public pages import corrected versions
  from `@/lib/public-queries` instead. The orchestrator should reconcile
  by fixing `@/lib/queries.ts` so other agents (e.g. admin, organizer
  dashboards) don't trip over the same PrismaClientValidationError.
- **Lint**: 4 errors remain in `bun run lint`, but ALL of them are in
  shared foundation files I am not allowed to edit:
  - `src/components/dashboard/dashboard-shell.tsx` (2 ×
    `react-hooks/static-components`)
  - `src/components/layout/site-header.tsx` (1 ×
    `react-hooks/set-state-in-effect`)
  - Plus an unrendered duplicate of `dashboard-shell.tsx` for `SidebarInner`
- **TypeScript**: All 25 tsc errors are in OTHER agents' files
  (`src/app/admin/...`, `src/app/api/admin/...`, `src/lib/queries.ts`,
  `examples/`, `skills/`). My public files compile cleanly.

## Verification
- All routes return 200 (home, tournaments listing + filters, tournament
  detail + 4 sub-pages, teams listing + detail, players listing + detail,
  fixtures + tabs, results, rankings, venues listing + detail, about,
  contact).
- `POST /api/public/contact` returns `{"ok":true,"message":"Message received"}`.
- All pages are async server components; only filters, tabs, and the
  contact form are small client components.
