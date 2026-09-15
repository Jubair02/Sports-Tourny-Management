// Public-site query helpers.
//
// These mirror the signatures of `@/lib/queries` but fix an include bug
// present in the shared layer (Match has `assignment: RefereeAssignment?`,
// not a direct `referee` relation). Public pages should import these instead
// of `getTournamentById`, `getTournamentBySlug`, `getFixtures` from
// `@/lib/queries` for now.

import { db } from "./db";

const MATCH_INCLUDE = {
  homeTeam: true,
  awayTeam: true,
  venue: true,
  assignment: { include: { referee: { include: { user: true } } } },
} as const;

export async function getTournamentById(id: string) {
  return db.tournament.findUnique({
    where: { id },
    include: {
      venue: true,
      organizer: { include: { user: true } },
      registrations: {
        include: {
          team: { include: { players: true, manager: { include: { user: true } } } },
        },
      },
      participants: { include: { team: true } },
      matches: { include: MATCH_INCLUDE, orderBy: { matchDate: "asc" } },
      standings: { include: { team: true } },
      announcements: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getTournamentBySlug(slug: string) {
  return db.tournament.findUnique({
    where: { slug },
    include: {
      venue: true,
      organizer: { include: { user: true } },
      registrations: { include: { team: true } },
      participants: { include: { team: true } },
      matches: { include: MATCH_INCLUDE, orderBy: { matchDate: "asc" } },
      standings: {
        include: { team: true },
        orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
      },
      announcements: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getFixtures(opts?: {
  status?: string;
  limit?: number;
  sport?: string;
}) {
  const where: any = {};
  if (opts?.status) where.status = opts.status;
  if (opts?.sport) where.tournament = { sport: opts.sport };
  return db.match.findMany({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
      tournament: true,
      venue: true,
      assignment: { include: { referee: { include: { user: true } } } },
    },
    orderBy: { matchDate: "asc" },
    take: opts?.limit,
  });
}

// Also exposes match's referee through a helper for fixtures page.
export function matchRefereeName(
  match: { assignment?: { referee?: { user?: { name: string } | null } | null } | null },
): string | null {
  const name = match?.assignment?.referee?.user?.name;
  return name ?? null;
}

// Team detail by ID (cuid) — not present in the shared layer.
export async function getTeamById(id: string) {
  return db.team.findUnique({
    where: { id },
    include: {
      players: { orderBy: { jerseyNumber: "asc" } },
      manager: { include: { user: true } },
      registrations: { include: { tournament: true } },
      participants: { include: { tournament: true } },
    },
  });
}
