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
import { AssignRefereeDialog } from "@/components/organizer/assign-referee-dialog";
import { Flag } from "lucide-react";
import { formatDate } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function RefereesPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [referees, matches] = await Promise.all([
    db.refereeProfile.findMany({
      include: { user: true,
        _count: { select: { assignments: true } },
      },
      orderBy: { user: { name: "asc" } },
      take: 100,
    }),
    db.match.findMany({
      where: { tournamentId: id, status: { in: ["SCHEDULED", "LIVE"] } },
      include: {
        homeTeam: true, awayTeam: true, venue: true,
        assignment: { include: { referee: { include: { user: true } } } },
      },
      orderBy: { matchDate: "asc" },
      take: 100,
    }),
  ]);

  const refereeList = referees.map((r) => ({
    id: r.id,
    name: r.user.name,
    specialization: r.specialization,
    district: r.district,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Link href={`/organizer/tournaments/${id}`} className="text-muted-foreground hover:text-foreground">Tournaments</Link>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span>Referees</span>
          </> as any
        }
        description="Browse registered referees and assign them to upcoming matches."
      />

      {/* Referee directory */}
      <Card>
        <CardContent className="p-0">
          {referees.length === 0 ? (
            <EmptyState icon={Flag} title="No referees registered" description="Once referees register on the platform they will appear here." />
          ) : (
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Specialization</TableHead>
                    <TableHead className="hidden md:table-cell">District</TableHead>
                    <TableHead className="text-center">Assignments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referees.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium">{r.user.name}</p>
                        <p className="text-xs text-muted-foreground">{r.user.email}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {r.specialization ? <StatusBadge label={r.specialization} color="secondary" /> : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{r.district ?? "—"}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{r._count.assignments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming matches needing referee assignment */}
      <Card>
        <CardContent className="p-0">
          {matches.length === 0 ? (
            <EmptyState icon={Flag} title="No upcoming matches" description="Generate fixtures first to assign referees." />
          ) : (
            <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Assigned Referee</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] text-muted-foreground">{m.matchCode}</p>
                          <p className="truncate text-sm font-medium">
                            {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {m.matchDate ? formatDate(m.matchDate) : "TBD"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {m.assignment?.referee?.user?.name ?? <span className="text-amber-600 dark:text-amber-400">Unassigned</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <AssignRefereeDialog
                          tournamentId={id}
                          matchId={m.id}
                          matchCode={m.matchCode}
                          currentRefereeId={m.assignment?.refereeId ?? null}
                          referees={refereeList}
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
