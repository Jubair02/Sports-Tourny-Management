import { notFound } from "next/navigation";
import { Trophy, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/page-elements";
import { StandingsTable } from "@/components/public/standings-table";
import { TournamentSubHeader } from "@/components/public/tournament-sub-header";
import { getTournamentById } from "@/lib/public-queries";

export default async function TournamentStandingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTournamentById(id);
  if (!t) notFound();

  const isCricket = t.sport === "CRICKET";
  // Sort standings by points desc, then GD, then GF
  const standings = [...t.standings].sort(
    (a, b) =>
      b.points - a.points ||
      (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor,
  );

  return (
    <div>
      <TournamentSubHeader t={t} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Standings</h2>
            <p className="text-sm text-muted-foreground">
              {standings.length} team{standings.length === 1 ? "" : "s"} in the table
            </p>
          </div>
        </div>

        {standings.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={Trophy}
              title="Standings not available"
              description="Standings are calculated from approved match results. They'll appear here once matches are completed."
            />
          </div>
        ) : (
          <Card className="mt-6 p-3 sm:p-5">
            <StandingsTable rows={standings} highlightTop={4} isCricket={isCricket} />
            <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              <span>
                Win = {t.winPoints} pts · Draw = {t.drawPoints} pt · Loss = {t.lossPoints} pts
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
