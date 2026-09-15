import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const session = await getSession();
  let profile = session ? await getTeamManagerProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.teamManagerProfile.findFirst({ include: { user: true } });
  }

  const teams = profile
    ? await db.team.findMany({
        where: { managerId: profile.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];
  const teamIds = teams.map((t) => t.id);

  // find standings entries for my teams
  const standings = teamIds.length
    ? await db.standing.findMany({
        where: { teamId: { in: teamIds } },
        include: { tournament: { select: { id: true, name: true, sport: true } }, team: { select: { id: true, name: true } } },
      })
    : [];

  // group by tournament
  const byTournament = new Map<string, { tournament: any; rows: any[] }>();
  for (const s of standings) {
    const key = s.tournamentId;
    if (!byTournament.has(key)) byTournament.set(key, { tournament: s.tournament, rows: [] });
    byTournament.get(key)!.rows.push(s);
  }

  // for each tournament, fetch ALL standings sorted
  const tournamentIds = [...byTournament.keys()];
  const fullStandingsByTournament = await Promise.all(
    tournamentIds.map((tid) =>
      db.standing.findMany({
        where: { tournamentId: tid },
        include: { team: true },
        orderBy: [{ points: "desc" }, { goalsFor: "desc" }, { won: "desc" }],
      })
    )
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Standings"
        description="League tables for tournaments your teams are participating in."
      />

      {byTournament.size === 0 ? (
        <EmptyState
          icon={Award}
          title="No standings yet"
          description="Once your teams are approved and matches played, standings will appear here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {[...byTournament.entries()].map(([tid, entry], idx) => {
            const allRows = fullStandingsByTournament[idx] ?? [];
            const isFootballLike = entry.tournament.sport === "FOOTBALL" || entry.tournament.sport === "FUTSAL";
            const myTeamIds = new Set(teamIds);
            return (
              <Card key={tid}>
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-primary" /> {entry.tournament.name}
                  </CardTitle>
                  <Link href={`/tournaments/${tid}/standings`} className="text-xs text-primary hover:underline">
                    Full table
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card border-b text-xs">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">#</th>
                          <th className="px-2 py-2 text-left font-medium">Team</th>
                          <th className="px-2 py-2 text-center font-medium">P</th>
                          <th className="px-2 py-2 text-center font-medium">W</th>
                          <th className="px-2 py-2 text-center font-medium">D</th>
                          <th className="px-2 py-2 text-center font-medium">L</th>
                          {isFootballLike && <th className="px-2 py-2 text-center font-medium">GD</th>}
                          <th className="px-2 py-2 text-center font-medium">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRows.map((row, i) => {
                          const mine = myTeamIds.has(row.teamId);
                          const gd = row.goalsFor - row.goalsAgainst;
                          return (
                            <tr key={row.id} className={mine ? "bg-primary/5 border-b" : "border-b last:border-0"}>
                              <td className="px-2 py-2">
                                <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${i < 3 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                                  {i + 1}
                                </span>
                              </td>
                              <td className="px-2 py-2 font-medium">
                                {row.team.name}
                                {mine && <span className="ml-1 text-[10px] text-primary">YOU</span>}
                              </td>
                              <td className="px-2 py-2 text-center tabular-nums">{row.played}</td>
                              <td className="px-2 py-2 text-center tabular-nums text-emerald-600 dark:text-emerald-400">{row.won}</td>
                              <td className="px-2 py-2 text-center tabular-nums">{row.drawn}</td>
                              <td className="px-2 py-2 text-center tabular-nums text-destructive">{row.lost}</td>
                              {isFootballLike && (
                                <td className="px-2 py-2 text-center tabular-nums text-xs text-muted-foreground">
                                  {gd > 0 ? `+${gd}` : gd}
                                </td>
                              )}
                              <td className="px-2 py-2 text-center tabular-nums font-bold">{row.points}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
