import Link from "next/link";
import { Clock, MapPin, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { MATCH_STATUS_META } from "@/lib/constants";
import { formatTime, formatDate, formatDateTime } from "@/lib/helpers";

type MatchCardProps = {
  match: {
    id: string;
    matchCode?: string | null;
    round?: string | null;
    status: string;
    matchDate?: Date | string | null;
    homeScore?: number | null;
    awayScore?: number | null;
    homeRuns?: number | null;
    awayRuns?: number | null;
    homeWickets?: number | null;
    awayWickets?: number | null;
    homeTeam?: { id: string; name: string } | null;
    awayTeam?: { id: string; name: string } | null;
    tournament?: { id: string; name: string; sport: string } | null;
    venue?: { name: string } | null;
  };
  compact?: boolean;
  showTournament?: boolean;
  className?: string;
};

function teamInitial(name?: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function MatchCard({
  match,
  compact = false,
  showTournament = true,
  className,
}: MatchCardProps) {
  const statusMeta = MATCH_STATUS_META[match.status];
  const completed = match.status === "COMPLETED";
  const scheduled = match.status === "SCHEDULED";
  const isLive = match.status === "LIVE";
  const sport = match.tournament?.sport;

  const homeScoreText = (() => {
    if (sport === "CRICKET" && match.homeRuns != null) {
      return `${match.homeRuns}/${match.homeWickets ?? 0}`;
    }
    return match.homeScore != null ? String(match.homeScore) : null;
  })();

  const awayScoreText = (() => {
    if (sport === "CRICKET" && match.awayRuns != null) {
      return `${match.awayRuns}/${match.awayWickets ?? 0}`;
    }
    return match.awayScore != null ? String(match.awayScore) : null;
  })();

  const homeWon = completed && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore;
  const awayWon = completed && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore;

  return (
    <Card className={cn("overflow-hidden p-0 py-0", compact && "text-sm", className)}>
      <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {showTournament && match.tournament && (
            <Link
              href={`/tournaments/${match.tournament.id}`}
              className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              {sport && <SportBadge sport={sport} withEmoji={false} />}
              <span className="line-clamp-1">{match.tournament.name}</span>
            </Link>
          )}
          {match.round && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              · {match.round.replace(/_/g, " ")}
            </span>
          )}
        </div>
        {statusMeta && (
          <StatusBadge label={statusMeta.label} color={statusMeta.color} dot={isLive} />
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamCell name={match.homeTeam?.name ?? "TBD"} initial={teamInitial(match.homeTeam?.name)} won={homeWon} linkId={match.homeTeam?.id} />
          <div className="flex flex-col items-center">
            {completed ? (
              <div className="flex items-center gap-1.5 text-base font-bold tabular-nums">
                <span className={cn(homeWon && "text-emerald-600 dark:text-emerald-400")}>{homeScoreText ?? "0"}</span>
                <span className="text-muted-foreground">:</span>
                <span className={cn(awayWon && "text-emerald-600 dark:text-emerald-400")}>{awayScoreText ?? "0"}</span>
              </div>
            ) : isLive ? (
              <span className="text-xs font-bold uppercase tracking-wide text-red-500">vs</span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">vs</span>
            )}
            {match.matchCode && (
              <span className="mt-0.5 text-[10px] text-muted-foreground">{match.matchCode}</span>
            )}
          </div>
          <TeamCell name={match.awayTeam?.name ?? "TBD"} initial={teamInitial(match.awayTeam?.name)} won={awayWon} linkId={match.awayTeam?.id} align="right" />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{match.matchDate ? (compact ? formatDate(match.matchDate) : formatDateTime(match.matchDate)) : "TBD"}</span>
          </div>
          {match.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{match.venue.name}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function TeamCell({
  name,
  initial,
  won,
  linkId,
  align = "left",
}: {
  name: string;
  initial: string;
  won?: boolean;
  linkId?: string;
  align?: "left" | "right";
}) {
  const inner = (
    <>
      <div className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/90 to-emerald-700 text-xs font-bold text-primary-foreground",
      )}>
        {initial}
      </div>
      <span className={cn("line-clamp-1 text-sm font-semibold", won && "text-emerald-600 dark:text-emerald-400")}>
        {name}
      </span>
    </>
  );
  return (
    <div className={cn("flex min-w-0 items-center gap-2", align === "right" && "flex-row-reverse text-right")}>
      {linkId ? <Link href={`/teams/${linkId}`} className="contents">{inner}</Link> : inner}
    </div>
  );
}
