import { Search, Trophy, SlidersHorizontal } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { TournamentCard } from "@/components/public/tournament-card";
import { TournamentFilters } from "@/components/public/tournament-filters";
import { getTournaments } from "@/lib/queries";
import { SPORT_META } from "@/lib/constants";

const PAGE_SIZE = 12;

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const getString = (k: string) => {
    const v = sp[k];
    if (Array.isArray(v)) return v[0];
    return v;
  };
  const q = getString("q");
  const sport = getString("sport");
  const status = getString("status");
  const category = getString("category");

  const tournaments = await getTournaments({
    q, sport, status, category,
    publishedOnly: true,
    limit: 100,
  });

  const visible = tournaments.slice(0, PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Tournaments"
        description="Discover and join sporting events across all 64 districts of Bangladesh."
      />

      <div className="mt-6 rounded-2xl border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </div>
        <TournamentFilters
          current={{ q, sport, status, category }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing <span className="font-semibold text-foreground">{visible.length}</span>
          {" "}of <span className="font-semibold text-foreground">{tournaments.length}</span> tournaments
          {sport && (
            <span> in <span className="font-medium">{SPORT_META[sport]?.label ?? sport}</span></span>
          )}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Trophy}
            title="No tournaments found"
            description="Try adjusting your filters or search keywords. New tournaments are added every week."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}
