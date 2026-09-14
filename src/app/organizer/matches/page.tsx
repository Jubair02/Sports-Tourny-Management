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
import { MATCH_STATUS_META, RESULT_STATUS_META } from "@/lib/constants";
import { formatDate, formatTime } from "@/lib/helpers";
import { ListChecks } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganizerMatchesPage() {
  const session = await getSession();
  if (!session) return null;

  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });

  const tournamentIds = prof
    ? (await db.tournament.findMany({ where: { organizerId: prof.id }, select: { id: true, sport: true } })).map((t) => t.id)
    : [];

  if (tournamentIds.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Matches" description="All matches across your tournaments." />
        <EmptyState icon={ListChecks} title="No tournaments yet" description="Create a tournament to schedule matches." />
      </div>
    );
  }

  const matches = await db.match.findMany({
    where: { tournamentId: { in: tournamentIds } },
    include: {
      homeTeam: true, awayTeam: true, venue: true,
      tournament: { select: { id: true, name: true, sport: true } },
      assignment: { include: { referee: { include: { user: true } } } },
    },
    orderBy: { matchDate: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Matches" description="All matches across your tournaments." />

      <Card>
        <CardContent className="p-0">
          {matches.length === 0 ? (
            <EmptyState icon={ListChecks} title="No matches" description="Generate fixtures in a tournament to see matches here." />
          ) : (
            <div className="max-h-[75vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead className="hidden md:table-cell">Tournament</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Referee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{m.matchCode}</TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                          </p>
                          {(m.status === "COMPLETED" || m.status === "LIVE") && (
                            <p className="text-xs text-muted-foreground">
                              {m.tournament.sport === "CRICKET"
                                ? `${m.homeRuns ?? 0}/${m.homeWickets ?? 0} vs ${m.awayRuns ?? 0}/${m.awayWickets ?? 0}`
                                : `${m.homeScore} - ${m.awayScore}`}
                            </p>
                          )}
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
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {m.matchDate ? (
                          <>
                            <p>{formatDate(m.matchDate)}</p>
                            <p className="text-[10px]">{formatTime(m.matchDate)}</p>
                          </>
                        ) : "TBD"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {m.assignment?.referee?.user?.name ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={MATCH_STATUS_META[m.status]?.label ?? m.status} color={MATCH_STATUS_META[m.status]?.color ?? "secondary"} dot />
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={RESULT_STATUS_META[m.resultStatus]?.label ?? m.resultStatus} color={RESULT_STATUS_META[m.resultStatus]?.color ?? "secondary"} />
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
