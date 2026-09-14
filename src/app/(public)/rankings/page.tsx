import Link from "next/link";
import { Trophy, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { UrlSelectFilter } from "@/components/public/url-filters";
import { getRankings } from "@/lib/queries";
import { SPORTS_LIST, SPORT_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const getStr = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const sport = getStr("sport");

  const rankings = await getRankings({ sport, limit: 50 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Rankings"
        description="Aggregate standings across every TourneyBD tournament. Teams earn points from wins and draws across all events."
      >
        <UrlSelectFilter
          param="sport"
          placeholder="All sports"
          options={SPORTS_LIST.map((s) => ({ value: s, label: `${SPORT_META[s]?.emoji} ${SPORT_META[s]?.label}` }))}
          className="h-9 w-[170px]"
        />
      </PageHeader>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">{rankings.length}</span> ranked team{rankings.length === 1 ? "" : "s"}
          {sport && <> in {SPORT_META[sport]?.label}</>}
        </p>
      </div>

      {rankings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Trophy}
            title="No rankings yet"
            description="Standings will be aggregated here as soon as matches are completed and approved."
          />
        </div>
      ) : (
        <Card className="mt-6 p-3 sm:p-5">
          {/* Podium for top 3 */}
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {rankings.slice(0, 3).map((r, i) => {
              const podium = [
                { ring: "ring-amber-400", label: "1st", emoji: "🥇", color: "text-amber-500" },
                { ring: "ring-slate-400", label: "2nd", emoji: "🥈", color: "text-slate-500" },
                { ring: "ring-orange-500", label: "3rd", emoji: "🥉", color: "text-orange-600" },
              ][i];
              return (
                <Link
                  key={r.team.id}
                  href={`/teams/${r.team.id}`}
                  className={cn(
                    "group rounded-xl border bg-card p-4 ring-2 transition-all hover:shadow-md",
                    podium.ring,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{podium.emoji}</span>
                    <Badge variant="secondary">{podium.label}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-1 text-base font-semibold tracking-tight group-hover:text-primary">
                    {r.team.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.won}W · {r.drawn}D · {r.lost}L · {r.tournaments} tournament{r.tournaments === 1 ? "" : "s"}
                  </p>
                  <p className={cn("mt-2 text-2xl font-bold tabular-nums", podium.color)}>
                    {r.points} <span className="text-xs font-medium text-muted-foreground">pts</span>
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Full table */}
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2 text-center w-12">#</th>
                  <th className="px-2 py-2">Team</th>
                  <th className="px-2 py-2 text-center">Tournaments</th>
                  <th className="px-2 py-2 text-center">P</th>
                  <th className="px-2 py-2 text-center">W</th>
                  <th className="px-2 py-2 text-center">D</th>
                  <th className="px-2 py-2 text-center">L</th>
                  <th className="px-2 py-2 text-center font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, i) => (
                  <tr key={r.team.id} className={cn("border-b last:border-b-0 transition-colors hover:bg-accent/50", i < 3 && "bg-amber-500/5")}>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {i < 3 ? (
                          <Medal className={cn(
                            "h-3.5 w-3.5",
                            i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-orange-600",
                          )} />
                        ) : null}
                        <span className="font-medium tabular-nums">{i + 1}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <Link href={`/teams/${r.team.id}`} className="font-medium hover:text-primary">
                        {r.team.name}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{r.tournaments}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{r.played}</td>
                    <td className="px-2 py-2 text-center tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{r.won}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{r.drawn}</td>
                    <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{r.lost}</td>
                    <td className="px-2 py-2 text-center font-bold tabular-nums">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
