import { Users, Search } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { TeamCard } from "@/components/public/team-card";
import { UrlSelectFilter, UrlSearchFilter } from "@/components/public/url-filters";
import { getTeams } from "@/lib/queries";
import { BANGLADESH_DIVISIONS, SPORTS_LIST, SPORT_META } from "@/lib/constants";

const districtOptions = (() => {
  const districts = new Set<string>();
  for (const list of Object.values(BANGLADESH_DIVISIONS)) {
    for (const d of list) districts.add(d);
  }
  return [...districts].sort();
})();

export default async function TeamsPage({
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
  const district = getStr("district");

  const teams = await getTeams({ q, district, limit: 60 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Teams"
        description="Browse teams from across Bangladesh and follow their journey through every tournament."
      />

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3">
        <UrlSearchFilter param="q" placeholder="Search teams by name…" />
        <UrlSelectFilter
          param="district"
          placeholder="All districts"
          options={districtOptions.map((d) => ({ value: d, label: d }))}
          className="h-9 w-[170px]"
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing <span className="font-semibold text-foreground">{teams.length}</span> team{teams.length === 1 ? "" : "s"}
          {district && <> in <span className="font-medium">{district}</span></>}
        </p>
      </div>

      {teams.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="No teams found"
            description="Try clearing your filters or search a different name."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => <TeamCard key={t.id} team={t} />)}
        </div>
      )}
    </div>
  );
}
