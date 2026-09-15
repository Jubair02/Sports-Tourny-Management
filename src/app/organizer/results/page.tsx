import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { ResultActionsButton } from "@/components/organizer/result-actions-button";
import { RESULT_STATUS } from "@/lib/constants";
import { formatDateTime } from "@/lib/helpers";
import { BarChart3, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganizerResultsPage() {
  const session = await getSession();
  if (!session) return null;

  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });

  const tournamentIds = prof
    ? (await db.tournament.findMany({ where: { organizerId: prof.id }, select: { id: true } })).map((t) => t.id)
    : [];

  if (tournamentIds.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Results" description="Approve referee-submitted results across your tournaments." />
        <EmptyState icon={BarChart3} title="No tournaments yet" description="Create a tournament to receive submitted results." />
      </div>
    );
  }

  const submitted = await db.match.findMany({
    where: { tournamentId: { in: tournamentIds }, resultStatus: RESULT_STATUS.SUBMITTED },
    include: {
      homeTeam: true, awayTeam: true, venue: true,
      tournament: { select: { id: true, name: true, sport: true } },
      assignment: { include: { referee: { include: { user: true } } } },
    },
    orderBy: { matchDate: "desc" },
    take: 100,
  });

  const scoreline = (m: any) => {
    if (m.tournament.sport === "CRICKET") {
      return `${m.homeRuns ?? 0}/${m.homeWickets ?? 0} vs ${m.awayRuns ?? 0}/${m.awayWickets ?? 0}`;
    }
    return `${m.homeScore} - ${m.awayScore}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Results" description="Approve referee-submitted results across your tournaments." />

      <Card>
        <CardContent className="p-0">
          {submitted.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No results pending"
              description="Referee-submitted results awaiting your approval will appear here."
            />
          ) : (
            <div className="max-h-[75vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead className="hidden md:table-cell">Tournament</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="hidden lg:table-cell">Referee</TableHead>
                    <TableHead className="hidden xl:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submitted.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] text-muted-foreground">{m.matchCode}</p>
                          <p className="truncate text-sm font-medium">
                            {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <SportBadge sport={m.tournament.sport} />
                          <Link href={`/organizer/tournaments/${m.tournament.id}`} className="truncate text-xs hover:text-primary">
                            {m.tournament.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold tabular-nums">{scoreline(m)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {m.assignment?.referee?.user?.name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                        {m.matchDate ? formatDateTime(m.matchDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ResultActionsButton
                          tournamentId={m.tournamentId}
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
    </div>
  );
}
