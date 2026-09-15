import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getRefereeProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { CalendarDays, Flag } from "lucide-react";
import { RefereeMatchesTabs } from "@/components/referee/matches-tabs";

export const dynamic = "force-dynamic";

type MatchRow = {
  id: string;
  matchCode: string | null;
  status: string;
  resultStatus: string;
  matchDate: string | null;
  homeScore: number;
  awayScore: number;
  homeRuns: number | null;
  homeWickets: number | null;
  awayRuns: number | null;
  awayWickets: number | null;
  playerOfMatch: string | null;
  tournament: { id: string; name: string; sport: string };
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  venue: { id: string; name: string } | null;
};

function serialize(m: any): MatchRow {
  return {
    id: m.id,
    matchCode: m.matchCode,
    status: m.status,
    resultStatus: m.resultStatus,
    matchDate: m.matchDate ? m.matchDate.toISOString() : null,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeRuns: m.homeRuns,
    homeWickets: m.homeWickets,
    awayRuns: m.awayRuns,
    awayWickets: m.awayWickets,
    playerOfMatch: m.playerOfMatch,
    tournament: { id: m.tournament.id, name: m.tournament.name, sport: m.tournament.sport },
    homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
    awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
    venue: m.venue ? { id: m.venue.id, name: m.venue.name } : null,
  };
}

export default async function RefereeMatchesPage() {
  const session = await getSession();
  let profile = session ? await getRefereeProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.refereeProfile.findFirst({ include: { user: true } });
  }

  const assignments = profile
    ? await db.refereeAssignment.findMany({
        where: { refereeId: profile.id },
        include: {
          match: {
            include: { homeTeam: true, awayTeam: true, tournament: true, venue: true },
          },
        },
        orderBy: { assignedAt: "desc" },
      })
    : [];

  const matches = assignments.map((a) => a.match);
  const now = new Date();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

  const upcoming = matches
    .filter((m) => m.status === "SCHEDULED" && m.matchDate && m.matchDate >= now)
    .sort((a, b) => (a.matchDate!.getTime() - b.matchDate!.getTime()))
    .map(serialize);

  const today = matches
    .filter((m) => m.matchDate && m.matchDate >= startOfToday && m.matchDate <= endOfToday)
    .sort((a, b) => (a.matchDate!.getTime() - b.matchDate!.getTime()))
    .map(serialize);

  const completed = matches
    .filter((m) => m.status === "COMPLETED")
    .sort((a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0))
    .map(serialize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assignments"
        description="All matches assigned to you. Submit results when each match ends."
      />

      {matches.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No assignments yet"
          description="When an organizer assigns you to a match, it will appear here."
        />
      ) : (
        <RefereeMatchesTabs upcoming={upcoming} today={today} completed={completed} />
      )}
    </div>
  );
}
