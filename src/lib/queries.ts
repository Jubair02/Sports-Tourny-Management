import { db } from "./db";

// ─── Tournaments ────────────────────────────────────────────────────────────

export async function getTournaments(opts?: {
  sport?: string;
  status?: string;
  category?: string;
  q?: string;
  limit?: number;
  publishedOnly?: boolean;
}) {
  const where: any = {};
  if (opts?.sport) where.sport = opts.sport;
  if (opts?.status) where.status = opts.status;
  if (opts?.category) where.category = opts.category;
  if (opts?.q) {
    where.OR = [
      { name: { contains: opts.q } },
      { description: { contains: opts.q } },
      { location: { contains: opts.q } },
    ];
  }
  if (opts?.publishedOnly) {
    where.status = { in: ["PUBLISHED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING", "COMPLETED"] };
    if (opts?.status) where.status = opts.status;
  }
  return db.tournament.findMany({
    where,
    include: {
      venue: true,
      organizer: { include: { user: true } },
      _count: { select: { registrations: true, matches: true } },
    },
    orderBy: { startDate: "desc" },
    take: opts?.limit,
  });
}

export async function getFeaturedTournaments(limit = 6) {
  return db.tournament.findMany({
    where: { status: { in: ["REGISTRATION_OPEN", "ONGOING", "PUBLISHED"] } },
    include: {
      venue: true,
      organizer: { include: { user: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: [{ status: "asc" }, { startDate: "asc" }],
    take: limit,
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
      matches: {
        include: { homeTeam: true, awayTeam: true, venue: true, assignment: { include: { referee: { include: { user: true } } } } },
        orderBy: { matchDate: "asc" },
      },
      standings: { include: { team: true }, orderBy: [{ points: "desc" }, { goalsFor: "desc" }] },
      announcements: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getTournamentById(id: string) {
  return db.tournament.findUnique({
    where: { id },
    include: {
      venue: true,
      organizer: { include: { user: true } },
      registrations: { include: { team: { include: { players: true, manager: { include: { user: true } } } } } },
      participants: { include: { team: true } },
      matches: {
        include: { homeTeam: true, awayTeam: true, venue: true, assignment: { include: { referee: { include: { user: true } } } } },
        orderBy: { matchDate: "asc" },
      },
      standings: { include: { team: true } },
      announcements: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

// ─── Teams & Players ─────────────────────────────────────────────────────────

export async function getTeams(opts?: { q?: string; sport?: string; district?: string; limit?: number }) {
  const where: any = {};
  if (opts?.q) where.name = { contains: opts.q };
  if (opts?.district) where.district = opts.district;
  return db.team.findMany({
    where,
    include: {
      players: true,
      manager: { include: { user: true } },
      _count: { select: { registrations: true, participants: true } },
    },
    orderBy: { name: "asc" },
    take: opts?.limit,
  });
}

export async function getTeamBySlug(slug: string) {
  return db.team.findUnique({
    where: { slug },
    include: {
      players: { orderBy: { jerseyNumber: "asc" } },
      manager: { include: { user: true } },
      registrations: { include: { tournament: true } },
      participants: { include: { tournament: true } },
    },
  });
}

export async function getPlayers(opts?: { q?: string; position?: string; limit?: number }) {
  const where: any = {};
  if (opts?.q) where.name = { contains: opts.q };
  if (opts?.position) where.position = opts.position;
  return db.player.findMany({
    where,
    include: { team: true },
    orderBy: { name: "asc" },
    take: opts?.limit,
  });
}

export async function getPlayerById(id: string) {
  return db.player.findUnique({
    where: { id },
    include: { team: { include: { manager: { include: { user: true } } } } },
  });
}

// ─── Matches & Fixtures ──────────────────────────────────────────────────────

export async function getFixtures(opts?: { status?: string; limit?: number; sport?: string }) {
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

export async function getUpcomingMatches(limit = 6) {
  return db.match.findMany({
    where: {
      status: "SCHEDULED",
      matchDate: { gte: new Date() },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      tournament: true,
      venue: true,
    },
    orderBy: { matchDate: "asc" },
    take: limit,
  });
}

export async function getTodaysMatches() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return db.match.findMany({
    where: { matchDate: { gte: start, lte: end } },
    include: { homeTeam: true, awayTeam: true, tournament: true, venue: true },
    orderBy: { matchDate: "asc" },
  });
}

export async function getRecentResults(limit = 6) {
  return db.match.findMany({
    where: { status: "COMPLETED", resultStatus: "APPROVED" },
    include: { homeTeam: true, awayTeam: true, tournament: true, venue: true },
    orderBy: { matchDate: "desc" },
    take: limit,
  });
}

// ─── Standings / Rankings ───────────────────────────────────────────────────

export async function getRankings(opts?: { sport?: string; limit?: number }) {
  // Top teams across tournaments by total points
  const standings = await db.standing.findMany({
    where: opts?.sport ? { tournament: { sport: opts.sport } } : {},
    include: { team: true, tournament: true },
    take: opts?.limit ?? 50,
  });
  // aggregate by team
  const map = new Map<string, any>();
  for (const s of standings) {
    const existing = map.get(s.teamId) ?? {
      team: s.team,
      tournaments: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      points: 0,
    };
    existing.tournaments += 1;
    existing.played += s.played;
    existing.won += s.won;
    existing.drawn += s.drawn;
    existing.lost += s.lost;
    existing.points += s.points;
    map.set(s.teamId, existing);
  }
  return [...map.values()].sort((a, b) => b.points - a.points || b.won - a.won).slice(0, opts?.limit ?? 20);
}

// ─── Venues ──────────────────────────────────────────────────────────────────

export async function getVenues() {
  return db.venue.findMany({
    include: { _count: { select: { matches: true, tournaments: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getVenueById(id: string) {
  return db.venue.findUnique({
    where: { id },
    include: {
      matches: { include: { homeTeam: true, awayTeam: true, tournament: true }, take: 10, orderBy: { matchDate: "desc" } },
      tournaments: { include: { organizer: { include: { user: true } } } },
    },
  });
}

// ─── Dashboard helpers ───────────────────────────────────────────────────────

export async function getOrganizerProfile(userId: string) {
  return db.organizerProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
}

export async function getTeamManagerProfile(userId: string) {
  return db.teamManagerProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
}

export async function getRefereeProfile(userId: string) {
  return db.refereeProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
}

export async function getOrganizerTournaments(organizerId: string) {
  return db.tournament.findMany({
    where: { organizerId },
    include: {
      venue: true,
      _count: { select: { registrations: true, matches: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTeamManagerTeams(managerId: string) {
  return db.team.findMany({
    where: { managerId },
    include: {
      players: true,
      registrations: { include: { tournament: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRefereeAssignments(refereeId: string) {
  return db.refereeAssignment.findMany({
    where: { refereeId },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true, tournament: true, venue: true },
      },
    },
    orderBy: { assignedAt: "desc" },
  });
}

// ─── Admin aggregates ────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [
    users, organizers, teams, tournaments, activeTournaments,
    completedTournaments, pendingApprovals, matches, completedMatches,
    disputes, pendingReg,
  ] = await Promise.all([
    db.user.count(),
    db.organizerProfile.count(),
    db.team.count(),
    db.tournament.count(),
    db.tournament.count({ where: { status: "ONGOING" } }),
    db.tournament.count({ where: { status: "COMPLETED" } }),
    db.organizerProfile.count({ where: { approvalStatus: "PENDING" } }),
    db.match.count(),
    db.match.count({ where: { status: "COMPLETED" } }),
    db.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    db.tournamentRegistration.count({ where: { status: "PENDING" } }),
  ]);
  return {
    users, organizers, teams, tournaments, activeTournaments,
    completedTournaments, pendingApprovals, matches, completedMatches,
    disputes, pendingReg,
  };
}
