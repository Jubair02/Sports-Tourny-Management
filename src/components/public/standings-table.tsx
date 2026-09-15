import { cn } from "@/lib/utils";
import { Medal } from "lucide-react";
import Link from "next/link";

type StandingRow = {
  teamId: string;
  team: { id: string; name: string };
  group?: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export function StandingsTable({
  rows,
  highlightTop = 0,
  isCricket = false,
  showGroup = false,
}: {
  rows: StandingRow[];
  highlightTop?: number;
  isCricket?: boolean;
  showGroup?: boolean;
}) {
  const sorted = [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor,
  );
  const gfLabel = isCricket ? "RF" : "GF";
  const gaLabel = isCricket ? "RA" : "GA";
  const gdLabel = isCricket ? "Diff" : "GD";

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-2 py-2 text-center w-10">#</th>
            <th className="px-2 py-2">Team</th>
            {showGroup && <th className="px-2 py-2 text-center">G</th>}
            <th className="px-2 py-2 text-center">P</th>
            <th className="px-2 py-2 text-center">W</th>
            <th className="px-2 py-2 text-center">D</th>
            <th className="px-2 py-2 text-center">L</th>
            <th className="px-2 py-2 text-center">{gfLabel}</th>
            <th className="px-2 py-2 text-center">{gaLabel}</th>
            <th className="px-2 py-2 text-center">{gdLabel}</th>
            <th className="px-2 py-2 text-center font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const gd = r.goalsFor - r.goalsAgainst;
            const isTop = i < Math.max(highlightTop, 0);
            const medalColor = i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-600" : "";
            return (
              <tr
                key={r.teamId}
                className={cn(
                  "border-b last:border-b-0 transition-colors hover:bg-accent/50",
                  isTop && "bg-emerald-500/5",
                )}
              >
                <td className="px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    {i < 3 ? (
                      <Medal className={cn("h-3.5 w-3.5", medalColor)} />
                    ) : null}
                    <span className="font-medium tabular-nums">{i + 1}</span>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <Link
                    href={`/teams/${r.team.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {r.team.name}
                  </Link>
                </td>
                {showGroup && (
                  <td className="px-2 py-2 text-center text-muted-foreground">{r.group ?? "—"}</td>
                )}
                <td className="px-2 py-2 text-center tabular-nums">{r.played}</td>
                <td className="px-2 py-2 text-center tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{r.won}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.drawn}</td>
                <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{r.lost}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.goalsFor}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.goalsAgainst}</td>
                <td className="px-2 py-2 text-center tabular-nums">
                  {gd > 0 ? `+${gd}` : gd === 0 ? "0" : String(gd)}
                </td>
                <td className="px-2 py-2 text-center font-bold tabular-nums">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
