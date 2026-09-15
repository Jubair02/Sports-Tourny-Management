import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PLAYER_VERIFICATION } from "@/lib/constants";
import { ShieldCheck, BadgeCheck, Clock, Hash } from "lucide-react";

type PlayerCardProps = {
  player: {
    id: string;
    name: string;
    photo?: string | null;
    jerseyNumber?: number | null;
    position?: string | null;
    verificationStatus?: string | null;
    team?: { id: string; name: string } | null;
  };
  className?: string;
};

function positionLabel(pos?: string | null): string {
  if (!pos) return "—";
  const map: Record<string, string> = {
    GOALKEEPER: "Goalkeeper",
    DEFENDER: "Defender",
    MIDFIELDER: "Midfielder",
    FORWARD: "Forward",
    BATTER: "Batter",
    BOWLER: "Bowler",
    ALLROUNDER: "All-rounder",
    WICKETKEEPER: "Wicket-keeper",
  };
  return map[pos] ?? pos;
}

export function PlayerCard({ player, className }: PlayerCardProps) {
  const initial = (player.name?.[0] || "P").toUpperCase();
  const verified = player.verificationStatus === PLAYER_VERIFICATION.VERIFIED;
  const pending = player.verificationStatus === PLAYER_VERIFICATION.PENDING;

  return (
    <Link href={`/players/${player.id}`} className="group block">
      <Card className={cn("p-4 transition-all hover:shadow-md hover:-translate-y-0.5", className)}>
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-background">
            {player.photo ? (
              <img src={player.photo} alt={player.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-emerald-700 text-base font-bold text-primary-foreground">
                {initial}
              </div>
            )}
            {verified && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                <BadgeCheck className="h-3 w-3" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 font-semibold tracking-tight group-hover:text-primary">
              {player.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {player.team?.name ?? "Unattached"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
          <Badge variant="secondary" className="gap-1">
            {positionLabel(player.position)}
          </Badge>
          {player.jerseyNumber != null && (
            <Badge variant="outline" className="gap-1">
              <Hash className="h-3 w-3" />
              {player.jerseyNumber}
            </Badge>
          )}
          {verified && (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" /> Verified
            </Badge>
          )}
          {pending && (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Clock className="h-3 w-3" /> Pending
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
