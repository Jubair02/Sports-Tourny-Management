import { CalendarDays, Clock } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { MatchCard } from "@/components/public/match-card";
import { UrlSelectFilter } from "@/components/public/url-filters";
import { UrlTabs } from "@/components/public/url-tabs";
import {
  getTodaysMatches, getUpcomingMatches,
} from "@/lib/queries";
import { getFixtures } from "@/lib/public-queries";
import { SPORTS_LIST, SPORT_META } from "@/lib/constants";
import { formatDate } from "@/lib/helpers";

function groupByDate<
  T extends { matchDate?: Date | string | null },
>(matches: T[]): Array<{ date: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const m of matches) {
    const key = m.matchDate ? formatDate(m.matchDate) : "TBD";
    const arr = map.get(key) ?? [];
    arr.push(m);
    map.set(key, arr);
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }));
}

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const getStr = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const tab = getStr("tab") ?? "today";
  const sport = getStr("sport");

  let matches: Array<any> = [];
  let title = "";

  if (tab === "today") {
    matches = await getTodaysMatches();
    title = "Today's matches";
  } else if (tab === "upcoming") {
    matches = await getUpcomingMatches(50);
    title = "Upcoming matches";
  } else {
    matches = await getFixtures({ sport, limit: 100 });
    title = "All fixtures";
  }

  const filtered = sport ? matches.filter((m) => m.tournament?.sport === sport) : matches;
  const groups = groupByDate(filtered);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Fixtures"
        description="Catch every scheduled match across all TourneyBD tournaments."
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <UrlTabs
          param="tab"
          defaultKey="today"
          tabs={[
            { key: "today", label: "Today" },
            { key: "upcoming", label: "Upcoming" },
            { key: "all", label: "All" },
          ]}
        />
        <UrlSelectFilter
          param="sport"
          placeholder="All sports"
          options={SPORTS_LIST.map((s) => ({ value: s, label: `${SPORT_META[s]?.emoji} ${SPORT_META[s]?.label}` }))}
          className="h-9 w-[170px]"
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">{filtered.length}</span> match{filtered.length === 1 ? "" : "es"}
          {sport && <> in {SPORT_META[sport]?.label}</>}
        </p>
        <h2 className="font-medium">{title}</h2>
      </div>

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CalendarDays}
            title="No matches in this view"
            description="Try switching to another tab or clearing your sport filter."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((g) => (
            <section key={g.date}>
              <div className="sticky top-16 z-10 -mx-2 flex items-center gap-2 rounded-md bg-background/90 px-2 py-2 backdrop-blur">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{g.date}</h3>
                <span className="text-xs text-muted-foreground">· {g.items.length} match{g.items.length === 1 ? "" : "es"}</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((m) => (
                  <MatchCard key={m.id} match={m} compact />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
