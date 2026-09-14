import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import {
  MATCH_STATUS_META, RESULT_STATUS_META,
} from "@/lib/constants";
import { formatDateTime, formatTime, formatDate } from "@/lib/helpers";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });
  const tournament = await db.tournament.findUnique({ where: { id }, select: { id: true, name: true, organizerId: true, sport: true } });
  if (!tournament) notFound();
  if (session.role !== "ADMIN" && (!prof || prof.id !== tournament.organizerId)) notFound();

  const matches = await db.match.findMany({
    where: { tournamentId: id },
    include: {
      homeTeam: true, awayTeam: true, venue: true,
      assignment: { include: { referee: { include: { user: true } } } },
    },
    orderBy: { matchDate: "asc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Link href={`/organizer/tournaments/${id}`} className="text-muted-foreground hover:text-foreground">Tournaments</Link>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span>Matches</span>
          </> as any
        }
        description={`All matches for ${tournament.name}.`}
      />

      <Card>
        <CardContent className="p-0">
          {matches.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No matches" description="Generate fixtures first to see matches here." />
          ) : (
            <div className="max-h-[75vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead className="hidden md:table-cell">Date / Time</TableHead>
                    <TableHead className="hidden lg:table-cell">Venue</TableHead>
                    <TableHead className="hidden md:table-cell">Referee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.matchCode ?? "—"}</TableCell>
                      <TableCell className="text-xs">{m.round ?? "—"}</TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {m.homeTeam?.name ?? "TBD"}
                            <span className="mx-1 text-muted-foreground">vs</span>
                            {m.awayTeam?.name ?? "TBD"}
                          </p>
                          {(m.status === "COMPLETED" || m.status === "LIVE") && (
                            <p className="text-xs text-muted-foreground">
                              {tournament.sport === "CRICKET"
                                ? `${m.homeRuns ?? 0}/${m.homeWickets ?? 0} (${m.homeOvers ?? "—"}) vs ${m.awayRuns ?? 0}/${m.awayWickets ?? 0} (${m.awayOvers ?? "—"})`
                                : `${m.homeScore} - ${m.awayScore}`}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {m.matchDate ? (
                          <>
                            <p>{formatDate(m.matchDate)}</p>
                            <p className="text-[10px]">{formatTime(m.matchDate)}</p>
                          </>
                        ) : "Not scheduled"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {m.venue?.name ?? "TBD"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {m.assignment?.referee?.user?.name ?? <span className="text-muted-foreground">Unassigned</span>}
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
