import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getRefereeProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { SubmitResultForm, type MatchData, type PlayerOpt } from "@/components/referee/submit-result-form";
import {
  ArrowLeft, Clock, MapPin, Trophy, Calendar, Flag, User,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/helpers";
import { MATCH_STATUS_META, RESULT_STATUS_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function RefereeMatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let profile = session ? await getRefereeProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.refereeProfile.findFirst({ include: { user: true } });
  }

  const assignment = profile
    ? await db.refereeAssignment.findUnique({
        where: { matchId: id },
        include: {
          referee: { include: { user: true } },
          match: {
            include: {
              homeTeam: { include: { players: true } },
              awayTeam: { include: { players: true } },
              tournament: true,
              venue: true,
            },
          },
        },
      })
    : null;

  if (!assignment || !assignment.match) notFound();

  // Ownership: only assigned referee (or ADMIN) can submit
  const isOwner = profile && assignment.refereeId === profile.id;
  const isAdmin = session?.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Access Denied" />
        <EmptyState title="Not your assignment" description="Only the assigned referee can submit results for this match." />
      </div>
    );
  }

  const m = assignment.match;
  const matchMeta = MATCH_STATUS_META[m.status] ?? { label: m.status, color: "secondary" };
  const resultMeta = RESULT_STATUS_META[m.resultStatus] ?? { label: m.resultStatus, color: "secondary" };

  const matchData: MatchData = {
    id: m.id,
    matchCode: m.matchCode,
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
    resultStatus: m.resultStatus,
    status: m.status,
    tournament: { id: m.tournament.id, name: m.tournament.name, sport: m.tournament.sport },
    homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
    awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
    venue: m.venue ? { id: m.venue.id, name: m.venue.name } : null,
  };

  const homePlayers: PlayerOpt[] = m.homeTeam?.players.map((p) => ({
    id: p.id, name: p.name, jerseyNumber: p.jerseyNumber,
  })) ?? [];
  const awayPlayers: PlayerOpt[] = m.awayTeam?.players.map((p) => ({
    id: p.id, name: p.name, jerseyNumber: p.jerseyNumber,
  })) ?? [];

  // Already officially approved? Then we hide the form
  const isApproved = m.resultStatus === "APPROVED";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/referee/matches" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to assignments
        </Link>
      </div>

      <PageHeader
        title={`Match: ${m.homeTeam?.name ?? "TBD"} vs ${m.awayTeam?.name ?? "TBD"}`}
        description={`${m.tournament.name} · ${m.matchCode ?? "no code"}`}
      />

      {/* Match info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <SportBadge sport={m.tournament.sport} />
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge label={matchMeta.label} color={matchMeta.color} dot />
              {m.resultStatus !== "NONE" && <StatusBadge label={resultMeta.label} color={resultMeta.color} />}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {m.matchDate ? formatDateTime(m.matchDate) : "TBD"}</span>
            {m.venue?.name && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {m.venue.name}</span>}
            <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> {m.tournament.name}</span>
            <span className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5" /> Referee: {assignment.referee?.user?.name ?? "You"}</span>
          </div>
          {m.matchDate && (
            <p className="text-xs text-muted-foreground">
              Date: {formatDate(m.matchDate)}
            </p>
          )}
        </CardContent>
      </Card>

      {isApproved ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={User}
              title="Result is official"
              description="This result has been approved by the organizer. Contact them if you need a correction."
            />
          </CardContent>
        </Card>
      ) : (
        <SubmitResultForm match={matchData} homePlayers={homePlayers} awayPlayers={awayPlayers} />
      )}
    </div>
  );
}
