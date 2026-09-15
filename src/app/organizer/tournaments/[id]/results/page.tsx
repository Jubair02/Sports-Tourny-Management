import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, EmptyState, SectionHeading } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ResultActionsButton } from "@/components/organizer/result-actions-button";
import {
  RESULT_STATUS, RESULT_STATUS_META,
} from "@/lib/constants";
import { formatDateTime, formatDate } from "@/lib/helpers";
import { CheckCircle2, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });
  const tournament = await db.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, organizerId: true, sport: true },
  });
  if (!tournament) notFound();
  if (session.role !== "ADMIN" && (!prof || prof.id !== tournament.organizerId)) notFound();

  const [submitted, recentApproved, recentRejected] = await Promise.all([
    db.match.findMany({
      where: { tournamentId: id, resultStatus: RESULT_STATUS.SUBMITTED },
      include: {
        homeTeam: true, awayTeam: true, venue: true,
        assignment: { include: { referee: { include: { user: true } } } },
      },
      orderBy: { matchDate: "desc" },
      take: 50,
    }),
    db.match.findMany({
      where: { tournamentId: id, resultStatus: RESULT_STATUS.APPROVED },
      include: { homeTeam: true, awayTeam: true, venue: true, assignment: { include: { referee: { include: { user: true } } } } },
      orderBy: { matchDate: "desc" },
      take: 10,
    }),
    db.match.findMany({
      where: { tournamentId: id, resultStatus: RESULT_STATUS.REJECTED },
      include: { homeTeam: true, awayTeam: true, venue: true, assignment: { include: { referee: { include: { user: true } } } } },
      orderBy: { matchDate: "desc" },
      take: 5,
    }),
  ]);

  const scoreline = (m: any) => {
    if (tournament.sport === "CRICKET") {
      return `${m.homeRuns ?? 0}/${m.homeWickets ?? 0} vs ${m.awayRuns ?? 0}/${m.awayWickets ?? 0}`;
    }
    return `${m.homeScore} - ${m.awayScore}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Link href={`/organizer/tournaments/${id}`} className="text-muted-foreground hover:text-foreground">Tournaments</Link>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span>Results</span>
          </> as any
        }
        description="Approve submitted referee results. Only APPROVED results affect standings."
      />

      {/* Awaiting approval */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            Awaiting your approval
            {submitted.length > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {submitted.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {submitted.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={CheckCircle2} title="No results pending" description="Referee-submitted results will appear here for your approval." />
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="hidden md:table-cell">Referee</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submitted.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-muted-foreground">{m.matchCode}</p>
                          <p className="truncate text-sm font-medium">
                            {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                          </p>
                          {m.winnerTeamId && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              Winner: {m.winnerTeamId === m.homeTeamId ? m.homeTeam?.name : m.awayTeam?.name}
                              {m.playerOfMatch ? ` · POTM: ${m.playerOfMatch}` : ""}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold tabular-nums">{scoreline(m)}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {m.assignment?.referee?.user?.name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {m.matchDate ? formatDateTime(m.matchDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ResultActionsButton
                          tournamentId={id}
                          matchId={m.id}
                          matchCode={m.matchCode}
                          homeTeamName={m.homeTeam?.name}
                          awayTeamName={m.awayTeam?.name}
                          resultStatus={m.resultStatus}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent approved */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Approved Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentApproved.length === 0 ? (
            <div className="p-4">
              <EmptyState title="No approved results yet" />
            </div>
          ) : (
            <div className="max-h-72 divide-y overflow-y-auto scrollbar-thin">
              {recentApproved.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <StatusBadge label="Official" color="emerald" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                    </p>
                    <p className="text-xs text-muted-foreground">{scoreline(m)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.matchDate ? formatDate(m.matchDate) : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejected */}
      {recentRejected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently Rejected</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-72 divide-y overflow-y-auto scrollbar-thin">
              {recentRejected.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <StatusBadge label="Rejected" color="destructive" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                    </p>
                    {m.resultNote && <p className="text-xs text-muted-foreground">{m.resultNote}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
