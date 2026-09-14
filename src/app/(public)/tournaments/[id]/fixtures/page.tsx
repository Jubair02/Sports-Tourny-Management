import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, User, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/page-elements";
import { MatchCard } from "@/components/public/match-card";
import { TournamentSubHeader } from "@/components/public/tournament-sub-header";
import { getTournamentById } from "@/lib/public-queries";
import { formatDate, formatTime } from "@/lib/helpers";

function groupByDate<T extends { matchDate?: Date | string | null }>(matches: T[]): Array<{ date: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const m of matches) {
    if (!m.matchDate) {
      const key = "TBD";
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
      continue;
    }
    const key = formatDate(m.matchDate);
    const arr = map.get(key) ?? [];
    arr.push(m);
    map.set(key, arr);
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }));
}

export default async function TournamentFixturesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTournamentById(id);
  if (!t) notFound();

  const scheduled = t.matches.filter((m) => m.status === "SCHEDULED");
  const groups = groupByDate(scheduled);

  return (
    <div>
      <TournamentSubHeader t={t} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Fixtures</h2>
            <p className="text-sm text-muted-foreground">
              {scheduled.length} scheduled match{scheduled.length === 1 ? "" : "es"}
            </p>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={CalendarDays}
              title="No scheduled fixtures"
              description="Matches will appear here once the organizer generates fixtures."
            />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map((g) => (
              <div key={g.date}>
                <div className="sticky top-16 z-10 -mx-2 flex items-center gap-2 rounded-md bg-background/90 px-2 py-2 backdrop-blur">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{g.date}</h3>
                  <span className="text-xs text-muted-foreground">· {g.items.length} match{g.items.length === 1 ? "" : "es"}</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((m) => (
                    <MatchCard key={m.id} match={m} showTournament={false} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
