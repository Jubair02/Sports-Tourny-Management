import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { MATCH_STATUS_META, RESULT_STATUS_META } from "@/lib/constants";
import { formatDateTime, formatTime, formatDate } from "@/lib/helpers";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganizerFixturesPage() {
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
        <PageHeader title="Fixtures" description="All scheduled matches across your tournaments." />
        <EmptyState icon={CalendarDays} title="No tournaments yet" description="Create a tournament to schedule fixtures." />
      </div>
    );
  }

  const matches = await db.match.findMany({
    where: {
      tournamentId: { in: tournamentIds },
      status: "SCHEDULED",
      matchDate: { gte: new Date() },
    },
    include: {
      homeTeam: true, awayTeam: true, venue: true,
      tournament: { select: { id: true, name: true, sport: true } },
      assignment: { include: { referee: { include: { user: true } } } },
    },
    orderBy: { matchDate: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Fixtures" description="All upcoming scheduled matches across your tournaments." />

      <Card>
        <CardContent className="p-0">
          {matches.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming fixtures" description="Once you generate fixtures in a tournament, upcoming matches will appear here." />
          ) : (
            <div className="max-h-[75vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead className="hidden md:table-cell">Tournament</TableHead>
                    <TableHead className="hidden md:table-cell">Date / Time</TableHead>
                    <TableHead className="hidden lg:table-cell">Venue</TableHead>
                    <TableHead className="hidden lg:table-cell">Referee</TableHead>
                    <TableHead className="text-right">Manage</TableHead>
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
                      <TableCell className="hidden md:table-cell text-xs">
                        <Link href={`/organizer/tournaments/${m.tournament.id}`} className="hover:text-primary">
                          {m.tournament.name}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {m.matchDate ? (
                          <>
                            <p>{formatDate(m.matchDate)}</p>
                            <p className="text-[10px]">{formatTime(m.matchDate)}</p>
                          </>
                        ) : "TBD"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {m.venue?.name ?? "TBD"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {m.assignment?.referee?.user?.name ?? <span className="text-amber-600 dark:text-amber-400">Unassigned</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/organizer/tournaments/${m.tournament.id}/fixtures`} className="text-xs text-primary hover:underline">
                          Manage →
                        </Link>
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
