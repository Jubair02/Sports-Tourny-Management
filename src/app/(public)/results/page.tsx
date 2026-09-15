import Link from "next/link";
import { Trophy, Star, CalendarDays, MapPin, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { SportBadge } from "@/components/shared/sport-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { UrlSelectFilter } from "@/components/public/url-filters";
import { getRecentResults } from "@/lib/queries";
import { SPORTS_LIST, SPORT_META, RESULT_STATUS_META } from "@/lib/constants";
import { formatDate, relativeTime } from "@/lib/helpers";

export default async function ResultsPage({
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

  const all = await getRecentResults(50);
  const results = sport ? all.filter((m) => m.tournament?.sport === sport) : all;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Results"
        description="Latest approved match results across all TourneyBD tournaments."
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
          <span className="font-semibold text-foreground">{results.length}</span> approved result{results.length === 1 ? "" : "s"}
          {sport && <> in {SPORT_META[sport]?.label}</>}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={BarChart3}
            title="No results yet"
            description="Approved match results will appear here as tournaments progress."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((m) => {
            const isCricket = m.tournament?.sport === "CRICKET";
            const homeScore = isCricket && m.homeRuns != null
              ? `${m.homeRuns}/${m.homeWickets ?? 0}`
              : String(m.homeScore ?? 0);
            const awayScore = isCricket && m.awayRuns != null
              ? `${m.awayRuns}/${m.awayWickets ?? 0}`
              : String(m.awayScore ?? 0);
            const homeWon = (m.homeScore ?? 0) > (m.awayScore ?? 0);
            const awayWon = (m.awayScore ?? 0) > (m.homeScore ?? 0);
            const draw = !homeWon && !awayWon;
            const resultMeta = RESULT_STATUS_META[m.resultStatus];

            return (
              <Card key={m.id} className="overflow-hidden p-0 py-0 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2">
                  <Link
                    href={`/tournaments/${m.tournament.id}`}
                    className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
                  >
                    {m.tournament.sport && <SportBadge sport={m.tournament.sport} withEmoji={false} />}
                    <span className="line-clamp-1">{m.tournament.name}</span>
                  </Link>
                  {resultMeta && resultMeta.label !== "No Result" && (
                    <StatusBadge label={resultMeta.label} color={resultMeta.color} />
                  )}
                </div>

                <div className="p-4">
                  <div className="space-y-2">
                    <TeamRow name={m.homeTeam?.name ?? "TBD"} score={homeScore} won={homeWon} draw={draw} teamId={m.homeTeam?.id} />
                    <div className="flex items-center justify-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      vs
                    </div>
                    <TeamRow name={m.awayTeam?.name ?? "TBD"} score={awayScore} won={awayWon} draw={draw} teamId={m.awayTeam?.id} />
                  </div>

                  {m.playerOfMatch && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 p-2 text-xs">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-muted-foreground">Player of the match:</span>
                      <span className="font-medium">{m.playerOfMatch}</span>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3" />
                      {m.matchDate ? formatDate(m.matchDate) : "TBD"} · {m.matchDate ? relativeTime(m.matchDate) : ""}
                    </span>
                    {m.venue && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> <span className="line-clamp-1">{m.venue.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamRow({
  name, score, won, draw, teamId,
}: {
  name: string;
  score: string;
  won: boolean;
  draw: boolean;
  teamId?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {won && <Trophy className="h-4 w-4 shrink-0 text-amber-500" />}
        {teamId ? (
          <Link href={`/teams/${teamId}`} className="line-clamp-1 text-sm font-semibold hover:text-primary">
            {name}
          </Link>
        ) : (
          <span className="line-clamp-1 text-sm font-semibold">{name}</span>
        )}
        {draw && <Badge variant="outline" className="text-[10px]">Draw</Badge>}
      </div>
      <span className={`font-mono tabular-nums ${won ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
        {score}
      </span>
    </div>
  );
}
