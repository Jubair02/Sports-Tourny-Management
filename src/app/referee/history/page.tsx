import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getRefereeProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { History, Award, Trophy, Calendar, MapPin } from "lucide-react";
import { formatDate } from "@/lib/helpers";
import { RESULT_STATUS_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function RefereeHistoryPage() {
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

  const completed = assignments
    .map((a) => a.match)
    .filter((m) => m.status === "COMPLETED")
    .sort((a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Match History"
        description="Matches you've officiated and their result status."
      />

      {completed.length === 0 ? (
        <EmptyState
          icon={History}
          title="No completed matches yet"
          description="Matches you officiate will appear here once they're marked COMPLETED."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {completed.map((m) => {
            const meta = RESULT_STATUS_META[m.resultStatus] ?? { label: m.resultStatus, color: "secondary" };
            const isFootballLike = m.tournament.sport === "FOOTBALL" || m.tournament.sport === "FUTSAL";
            const homeWon = m.winnerTeamId === m.homeTeamId;
            const awayWon = m.winnerTeamId === m.awayTeamId;
            return (
              <Card key={m.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <SportBadge sport={m.tournament.sport} />
                    <StatusBadge label={meta.label} color={meta.color} dot />
                  </div>
                  <p className="text-xs text-muted-foreground">{m.tournament.name}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={homeWon ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-medium"}>
                        {m.homeTeam?.name ?? "TBD"}
                      </span>
                      {isFootballLike && (
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm tabular-nums">
                          {m.homeScore} - {m.awayScore}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={awayWon ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-medium"}>
                        {m.awayTeam?.name ?? "TBD"}
                      </span>
                      {!isFootballLike && m.homeRuns != null && m.awayRuns != null && (
                        <span className="text-xs text-muted-foreground">
                          {m.homeRuns}/{m.homeWickets} · {m.awayRuns}/{m.awayWickets}
                        </span>
                      )}
                    </div>
                  </div>
                  {m.winnerTeamId && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <Trophy className="h-3 w-3" /> {homeWon ? m.homeTeam?.name : awayWon ? m.awayTeam?.name : "Tied"}
                    </div>
                  )}
                  {m.playerOfMatch && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Award className="h-3 w-3" /> {m.playerOfMatch}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(m.matchDate)}</span>
                    {m.venue?.name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.venue.name}</span>}
                  </div>
                  <Link href={`/referee/matches/${m.id}`} className="block text-xs text-primary hover:underline">
                    View details
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
