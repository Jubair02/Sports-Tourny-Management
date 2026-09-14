import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { SportBadge } from "@/components/shared/sport-badge";
import { Users, MapPin } from "lucide-react";
import { formatDate } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function OrganizerTeamsPage() {
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
        <PageHeader title="Teams" description="All teams approved into your tournaments." />
        <EmptyState icon={Users} title="No tournaments yet" description="Create a tournament to see participating teams." />
      </div>
    );
  }

  // Unique teams across all tournaments (approved registrations)
  const registrations = await db.tournamentRegistration.findMany({
    where: { tournamentId: { in: tournamentIds }, status: "APPROVED" },
    include: {
      team: {
        include: {
          manager: { include: { user: true } },
          _count: { select: { players: true } },
        },
      },
      tournament: { select: { id: true, name: true, sport: true } },
    },
    orderBy: { team: { name: "asc" } },
  });

  // Dedupe by teamId but track which tournaments each team is in
  const teamMap = new Map<string, { team: any; tournaments: any[] }>();
  for (const r of registrations) {
    const existing = teamMap.get(r.team.id);
    if (existing) {
      existing.tournaments.push(r.tournament);
    } else {
      teamMap.set(r.team.id, { team: r.team, tournaments: [r.tournament] });
    }
  }
  const rows = [...teamMap.values()];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="All teams approved into your tournaments."
      />

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={Users} title="No approved teams" description="Approve registrations to see teams here." />
          ) : (
            <div className="max-h-[75vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead className="hidden md:table-cell">Manager</TableHead>
                    <TableHead className="hidden sm:table-cell">District</TableHead>
                    <TableHead className="hidden lg:table-cell">Players</TableHead>
                    <TableHead>Tournaments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ team, tournaments }) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{team.name}</p>
                            {team.captain && <p className="truncate text-xs text-muted-foreground">Captain: {team.captain}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {team.manager?.user?.name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {team.district ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {team._count.players}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tournaments.map((t: any) => (
                            <Link key={t.id} href={`/organizer/tournaments/${t.id}`}>
                              <SportBadge sport={t.sport} />
                            </Link>
                          ))}
                        </div>
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
