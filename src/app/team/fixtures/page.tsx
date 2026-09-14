import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { SportBadge } from "@/components/shared/sport-badge";
import { CalendarDays, Clock, MapPin, Trophy } from "lucide-react";
import { formatDateTime, formatTime, formatDate } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function FixturesPage() {
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
  const teamMap = new Map(teams.map((t) => [t.id, t.name]));

  const now = new Date();
  const matches = teamIds.length
    ? await db.match.findMany({
        where: {
          OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
          status: "SCHEDULED",
          matchDate: { gte: now },
        },
        include: { homeTeam: true, awayTeam: true, tournament: true, venue: true },
        orderBy: { matchDate: "asc" },
      })
    : [];

  // group by date
  const byDate = new Map<string, typeof matches>();
  for (const m of matches) {
    const key = m.matchDate ? formatDate(m.matchDate) : "TBD";
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(m);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fixtures"
        description="Upcoming matches for your teams."
      />

      {matches.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No upcoming fixtures" description="When your teams are scheduled, matches will appear here." />
      ) : (
        <div className="space-y-6">
          {[...byDate.entries()].map(([date, list]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">{date}</h2>
                <span className="text-xs text-muted-foreground">· {list.length} match(es)</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <SportBadge sport={m.tournament.sport} />
                        <span className="text-[10px] text-muted-foreground">{m.tournament.name}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{m.homeTeam?.name ?? "TBD"}</span>
                          <span className="text-xs text-muted-foreground">vs</span>
                          <span className="font-medium">{m.awayTeam?.name ?? "TBD"}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {m.matchDate ? formatTime(m.matchDate) : "TBD"}
                          </span>
                          {m.venue?.name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {m.venue.name}
                            </span>
                          )}
                        </div>
                        {m.matchCode && (
                          <p className="text-[10px] text-muted-foreground">Code: {m.matchCode}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
