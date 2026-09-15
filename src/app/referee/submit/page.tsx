import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getRefereeProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { ClipboardCheck, Flag } from "lucide-react";
import { SubmitResultPicker, type PendingMatch, type TeamPlayers } from "@/components/referee/submit-result-picker";

export const dynamic = "force-dynamic";

export default async function RefereeSubmitPage() {
  const session = await getSession();
  let profile = session ? await getRefereeProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.refereeProfile.findFirst({ include: { user: true } });
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Submit Result" />
        <EmptyState icon={Flag} title="No referee profile" description="Contact an admin to set up your referee profile." />
      </div>
    );
  }

  const assignments = await db.refereeAssignment.findMany({
    where: { refereeId: profile.id },
    include: {
      match: {
        include: {
          homeTeam: { include: { players: true } },
          awayTeam: { include: { players: true } },
          tournament: true,
          venue: true,
        },
      },
    },
  });

  // Include matches that are scheduled/live (can submit) AND also already-submitted ones (so referee can re-submit/edit)
  const pending = assignments
    .map((a) => a.match)
    .filter((m) => (m.status === "SCHEDULED" || m.status === "LIVE" || m.resultStatus === "SUBMITTED"))
    .sort((a, b) => (a.matchDate?.getTime() ?? 0) - (b.matchDate?.getTime() ?? 0));

  const pendingMatches: PendingMatch[] = pending.map((m) => ({
    id: m.id,
    matchCode: m.matchCode,
    matchDate: m.matchDate ? m.matchDate.toISOString() : null,
    status: m.status,
    resultStatus: m.resultStatus,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeRuns: m.homeRuns,
    homeWickets: m.homeWickets,
    homeOvers: m.homeOvers,
    awayRuns: m.awayRuns,
    awayWickets: m.awayWickets,
    awayOvers: m.awayOvers,
    playerOfMatch: m.playerOfMatch,
    notes: m.notes,
    tournament: { id: m.tournament.id, name: m.tournament.name, sport: m.tournament.sport },
    homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
    awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
    venue: m.venue ? { id: m.venue.id, name: m.venue.name } : null,
  }));

  // Collect players for each team (home & away of all pending matches)
  const teamPlayers: TeamPlayers = {};
  for (const a of assignments) {
    const m = a.match;
    if (m.homeTeam) {
      teamPlayers[m.homeTeam.id] = m.homeTeam.players.map((p) => ({
        id: p.id,
        name: p.name,
        jerseyNumber: p.jerseyNumber,
      }));
    }
    if (m.awayTeam) {
      teamPlayers[m.awayTeam.id] = m.awayTeam.players.map((p) => ({
        id: p.id,
        name: p.name,
        jerseyNumber: p.jerseyNumber,
      }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit Result"
        description="Pick a match you've been assigned to and submit its result. Results go to the organizer for approval."
      />
      {pendingMatches.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No matches to submit"
          description="When you've officiated a match that needs a result, it will appear here."
        />
      ) : (
        <SubmitResultPicker pendingMatches={pendingMatches} teamPlayers={teamPlayers} />
      )}
    </div>
  );
}
