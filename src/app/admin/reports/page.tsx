import { db } from "@/lib/db";
import { PageHeader, SectionHeading, StatCard } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SportBadge } from "@/components/shared/sport-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReportsCharts } from "@/components/admin/reports-charts";
import { taka } from "@/lib/helpers";
import { SPORT_META, TOURNAMENT_STATUS_META } from "@/lib/constants";
import { Trophy, MapPin, Users, Wallet, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [
    tournaments,
    bySportGroup,
    byStatusGroup,
    byDistrictGroup,
    topTeamsRaw,
    verifiedRegs,
  ] = await Promise.all([
    db.tournament.findMany({
      select: {
        id: true, name: true, sport: true, status: true,
        district: true, division: true, entryFee: true,
      },
    }),
    db.tournament.groupBy({ by: ["sport"], _count: { _all: true } }),
    db.tournament.groupBy({ by: ["status"], _count: { _all: true } }),
    db.tournament.groupBy({ by: ["district"], _count: { _all: true } }),
    db.standing.findMany({
      include: { team: { select: { id: true, name: true, district: true } } },
      orderBy: { points: "desc" },
      take: 50,
    }),
    // Revenue: sum of entryFee for verified registrations (resolved in JS below)
    db.tournamentRegistration.findMany({
      where: { paymentStatus: "VERIFIED" },
      include: { tournament: { select: { entryFee: true } } },
    }),
  ]);

  // Aggregate top teams across standings
  const teamMap = new Map<string, { id: string; name: string; district: string | null; tournaments: number; won: number; drawn: number; lost: number; points: number }>();
  for (const s of topTeamsRaw) {
    const key = s.teamId;
    const existing = teamMap.get(key) ?? {
      id: s.team.id, name: s.team.name, district: s.team.district,
      tournaments: 0, won: 0, drawn: 0, lost: 0, points: 0,
    };
    existing.tournaments += 1;
    existing.won += s.won;
    existing.drawn += s.drawn;
    existing.lost += s.lost;
    existing.points += s.points;
    teamMap.set(key, existing);
  }
  const topTeams = [...teamMap.values()].sort((a, b) => b.points - a.points || b.won - a.won).slice(0, 10);

  // Revenue: sum of entryFee for verified registrations (verifiedRegs fetched above)
  const totalRevenue = verifiedRegs.reduce((sum, r) => sum + (r.tournament.entryFee || 0), 0);
  const avgFee = tournaments.length > 0
    ? tournaments.reduce((s, t) => s + (t.entryFee || 0), 0) / tournaments.length
    : 0;

  const sportChart = bySportGroup.map((s) => ({
    name: SPORT_META[s.sport]?.label ?? s.sport,
    count: s._count._all,
  }));

  const statusChart = byStatusGroup.map((s) => ({
    name: TOURNAMENT_STATUS_META[s.status]?.label ?? s.status,
    value: s._count._all,
    color: TOURNAMENT_STATUS_META[s.status]?.color ?? "secondary",
  }));

  const districtChart = byDistrictGroup
    .filter((d) => d.district)
    .map((d) => ({ name: d.district as string, count: d._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Platform summary: tournament distribution, top teams, and revenue."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Tournaments" value={tournaments.length} icon={Trophy} accent="primary" />
        <StatCard label="Districts Reached" value={districtChart.length} icon={MapPin} accent="blue" />
        <StatCard label="Verified Registrations" value={verifiedRegs.length} icon={Users} accent="amber" />
        <StatCard label="Total Revenue" value={taka(totalRevenue)} icon={Wallet} accent="primary" hint={`Avg fee ${taka(avgFee)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tournaments by Sport</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportsCharts kind="sport" data={sportChart} />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {bySportGroup.map((s) => (
                <div key={s.sport} className="rounded-lg border bg-muted/30 p-2 text-center">
                  <SportBadge sport={s.sport} />
                  <p className="mt-1 text-xl font-bold tabular-nums">{s._count._all}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tournaments by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportsCharts kind="status" data={statusChart} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {byStatusGroup.map((s) => (
                <div key={s.status} className="flex items-center justify-between rounded-lg border bg-muted/30 p-2">
                  <StatusBadge label={TOURNAMENT_STATUS_META[s.status]?.label ?? s.status} color={TOURNAMENT_STATUS_META[s.status]?.color ?? "secondary"} />
                  <span className="font-bold tabular-nums">{s._count._all}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tournaments by District</CardTitle>
        </CardHeader>
        <CardContent>
          {districtChart.length === 0 ? (
            <p className="text-sm text-muted-foreground">No district data available.</p>
          ) : (
            <>
              <ReportsCharts kind="district" data={districtChart} />
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {districtChart.map((d) => (
                  <div key={d.name} className="rounded-lg border bg-muted/30 p-2 text-center">
                    <p className="truncate text-xs font-medium">{d.name}</p>
                    <p className="text-xl font-bold tabular-nums">{d.count}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-amber-500" />
            Top Teams by Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card border-b">
                <tr>
                  <th className="p-3 text-left font-medium">#</th>
                  <th className="p-3 text-left font-medium">Team</th>
                  <th className="p-3 text-left font-medium hidden md:table-cell">District</th>
                  <th className="p-3 text-center font-medium">Tournaments</th>
                  <th className="p-3 text-center font-medium">W</th>
                  <th className="p-3 text-center font-medium">D</th>
                  <th className="p-3 text-center font-medium">L</th>
                  <th className="p-3 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {topTeams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      No team standings yet — complete some matches to populate rankings.
                    </td>
                  </tr>
                ) : (
                  topTeams.map((t, i) => (
                    <tr key={t.id} className="border-b transition-colors hover:bg-muted/40">
                      <td className="p-3">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0 ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" :
                          i === 1 ? "bg-secondary text-muted-foreground" :
                          i === 2 ? "bg-orange-500/15 text-orange-700 dark:text-orange-400" :
                          "bg-muted text-muted-foreground"
                        }`}>{i + 1}</span>
                      </td>
                      <td className="p-3 font-medium">{t.name}</td>
                      <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">{t.district ?? "—"}</td>
                      <td className="p-3 text-center tabular-nums">{t.tournaments}</td>
                      <td className="p-3 text-center tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">{t.won}</td>
                      <td className="p-3 text-center tabular-nums text-muted-foreground">{t.drawn}</td>
                      <td className="p-3 text-center tabular-nums text-destructive">{t.lost}</td>
                      <td className="p-3 text-right font-bold tabular-nums">{t.points}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
