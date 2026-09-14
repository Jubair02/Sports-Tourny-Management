import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ListChecks, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/page-elements";
import { TournamentSubHeader } from "@/components/public/tournament-sub-header";
import { getTournamentById } from "@/lib/public-queries";
import {
  MATCH_STATUS_META, RESULT_STATUS_META, MATCH_STATUS,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/helpers";

const ROUND_LABEL: Record<string, string> = {
  GROUP: "Group",
  ROUND_1: "R1",
  ROUND_16: "R16",
  QUARTER_FINAL: "QF",
  SEMI_FINAL: "SF",
  FINAL: "F",
};

export default async function TournamentMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTournamentById(id);
  if (!t) notFound();

  const matches = [...t.matches].sort(
    (a, b) => (a.matchDate?.getTime() ?? 0) - (b.matchDate?.getTime() ?? 0),
  );

  return (
    <div>
      <TournamentSubHeader t={t} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">All matches</h2>
            <p className="text-sm text-muted-foreground">
              {matches.length} match{matches.length === 1 ? "" : "es"} in this tournament
            </p>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={ListChecks}
              title="No matches yet"
              description="Matches will appear here once fixtures are generated."
            />
          </div>
        ) : (
          <Card className="mt-6 p-2 sm:p-4">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Code</TableHead>
                    <TableHead className="w-16">Round</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead className="min-w-32">Date &amp; time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => {
                    const statusMeta = MATCH_STATUS_META[m.status];
                    const resultMeta = RESULT_STATUS_META[m.resultStatus];
                    const isCricket = t.sport === "CRICKET";
                    const homeScore = isCricket && m.homeRuns != null
                      ? `${m.homeRuns}/${m.homeWickets ?? 0}`
                      : String(m.homeScore ?? 0);
                    const awayScore = isCricket && m.awayRuns != null
                      ? `${m.awayRuns}/${m.awayWickets ?? 0}`
                      : String(m.awayScore ?? 0);
                    const isLive = m.status === MATCH_STATUS.LIVE;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {m.matchCode ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs uppercase">
                          {m.round ? (ROUND_LABEL[m.round] ?? m.round) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={m.homeTeam ? `/teams/${m.homeTeam.id}` : "#"} className="font-medium hover:text-primary">
                              {m.homeTeam?.name ?? "TBD"}
                            </Link>
                            <span className="text-muted-foreground text-xs">vs</span>
                            <Link href={m.awayTeam ? `/teams/${m.awayTeam.id}` : "#"} className="font-medium hover:text-primary">
                              {m.awayTeam?.name ?? "TBD"}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {m.matchDate ? (
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="h-3 w-3 text-muted-foreground" />
                              {formatDateTime(m.matchDate)}
                            </span>
                          ) : "TBD"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground line-clamp-1">
                          {m.venue?.name ?? "TBD"}
                        </TableCell>
                        <TableCell className="text-center font-mono tabular-nums">
                          {m.status === "COMPLETED" || isLive ? (
                            <span className={isLive ? "text-red-500 font-semibold" : ""}>
                              {homeScore} - {awayScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {statusMeta && <StatusBadge label={statusMeta.label} color={statusMeta.color} dot={isLive} />}
                        </TableCell>
                        <TableCell>
                          {resultMeta && resultMeta.label !== "No Result" && (
                            <StatusBadge label={resultMeta.label} color={resultMeta.color} />
                          )}
                          {m.winnerTeamId && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600">
                              <Trophy className="h-3 w-3" />
                              <span className="line-clamp-1">
                                {m.homeTeamId === m.winnerTeamId ? m.homeTeam?.name : m.awayTeam?.name}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
