import { db } from "@/lib/db";
import { getTeams } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { SportBadge } from "@/components/shared/sport-badge";
import { formatDate } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const teams = await getTeams({ limit: 200 });

  // For multi-sport teams we just show their primary sport from first registration (best-effort)
  // teams don't have a single sport field — they can play multiple
  const teamSports = await db.tournamentRegistration.findMany({
    where: { teamId: { in: teams.map((t: any) => t.id) } },
    include: { tournament: { select: { sport: true } } },
  });
  const teamSportMap = new Map<string, string[]>();
  teamSports.forEach((r) => {
    const arr = teamSportMap.get(r.teamId) ?? [];
    if (!arr.includes(r.tournament.sport)) arr.push(r.tournament.sport);
    teamSportMap.set(r.teamId, arr);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="All teams on the platform, with manager, district and player count."
      />

      <Card>
        <CardContent className="p-0">
          {teams.length === 0 ? (
            <EmptyState title="No teams" description="No teams have been created yet." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead className="hidden md:table-cell">District</TableHead>
                    <TableHead>Sports</TableHead>
                    <TableHead className="hidden lg:table-cell">Players</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((t: any) => {
                    const sports = teamSportMap.get(t.id) ?? [];
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {t.logo ? (
                              <img src={t.logo} alt={t.name} className="h-9 w-9 rounded-lg object-cover" />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold uppercase text-primary">
                                {t.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-medium">{t.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {t.captain ? `Captain: ${t.captain}` : "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{t.manager?.user?.name ?? "—"}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{t.manager?.user?.email}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {t.district ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {sports.length > 0 ? (
                              sports.map((s) => <SportBadge key={s} sport={s} />)
                            ) : (
                              <span className="text-xs text-muted-foreground">Not registered yet</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm font-medium">
                          {t.players?.length ?? 0}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {formatDate(t.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
