import { User, Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { PlayerCard } from "@/components/public/player-card";
import { UrlSearchFilter, UrlSelectFilter } from "@/components/public/url-filters";
import { getPlayers } from "@/lib/queries";
import { FOOTBALL_POSITIONS, CRICKET_POSITIONS } from "@/lib/constants";

const ALL_POSITIONS = [
  ...FOOTBALL_POSITIONS.map((p) => ({ value: p.value, label: `Football · ${p.label}` })),
  ...CRICKET_POSITIONS.map((p) => ({ value: p.value, label: `Cricket · ${p.label}` })),
];

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const getStr = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const q = getStr("q");
  const position = getStr("position");

  const players = await getPlayers({ q, position, limit: 60 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Players"
        description="Discover rising stars and verified athletes from teams across Bangladesh."
      />

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3">
        <UrlSearchFilter param="q" placeholder="Search players by name…" />
        <UrlSelectFilter
          param="position"
          placeholder="Any position"
          options={ALL_POSITIONS}
          className="h-9 w-[220px]"
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing <span className="font-semibold text-foreground">{players.length}</span> player{players.length === 1 ? "" : "s"}
        </p>
      </div>

      {players.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="No players found"
            description="Try clearing your filters or searching a different name."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players.map((p) => <PlayerCard key={p.id} player={p} />)}
        </div>
      )}
    </div>
  );
}
