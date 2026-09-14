import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { SportBadge } from "@/components/shared/sport-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { BarChart3, Calendar, MapPin, Award, Trophy } from "lucide-react";
import { formatDate } from "@/lib/helpers";
import { RESULT_STATUS_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const session = await getSession();
  let profile = session ? await getTeamManagerProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.teamManagerProfile.findFirst({ include: { user: true } });
  }

  const teams = profile
    ? await db.team.findMany({
        where: { managerId: profile.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];
  const teamIds = teams.map((t) => t.id);

  const matches = teamIds.length
    ? await db.match.findMany({
        where: {
          OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
          status: "COMPLETED",
        },
        include: { homeTeam: true, awayTeam: true, tournament: true, venue: true },
        orderBy: { matchDate: "desc" },
        take: 100,
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Results"
        description="Completed matches for your teams."
      />

      {matches.length === 0 ? (
        <EmptyState icon={BarChart3} title="No completed matches yet" description="Once your teams play matches, results will show here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => {
            const isFootballLike = m.tournament.sport === "FOOTBALL" || m.tournament.sport === "FUTSAL";
            const resultMeta = RESULT_STATUS_META[m.resultStatus] ?? { label: m.resultStatus, color: "secondary" };
            const homeWon = m.winnerTeamId === m.homeTeamId;
            const awayWon = m.winnerTeamId === m.awayTeamId;
            return (
              <Card key={m.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <SportBadge sport={m.tournament.sport} />
                    <StatusBadge label={resultMeta.label} color={resultMeta.color} dot />
                  </div>
                  <p className="text-xs text-muted-foreground">{m.tournament.name}</p>
                  <div className="space-y-1.5">
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
                      {!isFootballLike && (
                        <span className="text-xs text-muted-foreground">
                          {m.homeRuns != null ? `${m.homeRuns}/${m.homeWickets ?? 0}` : "—"} vs{" "}
                          {m.awayRuns != null ? `${m.awayRuns}/${m.awayWickets ?? 0}` : "—"}
                        </span>
                      )}
                    </div>
                  </div>
                  {m.winnerTeamId && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <Trophy className="h-3 w-3" /> Winner: {homeWon ? m.homeTeam?.name : awayWon ? m.awayTeam?.name : "—"}
                    </div>
                  )}
                  {m.playerOfMatch && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <Award className="h-3 w-3" /> Player of the Match: {m.playerOfMatch}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(m.matchDate)}</span>
                    {m.venue?.name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.venue.name}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
