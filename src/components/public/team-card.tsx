import Link from "next/link";
import { MapPin, Users, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SPORT_META } from "@/lib/constants";

type TeamCardProps = {
  team: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    district?: string | null;
    address?: string | null;
    captain?: string | null;
    sport?: string | null;
    players?: { id: string }[];
    _count?: { players?: number; registrations?: number };
    manager?: { user?: { name: string } | null } | null;
  };
  className?: string;
};

// Picks an emerald-ish gradient based on team name for the initial avatar.
function gradientFor(name: string): string {
  const gradients = [
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-violet-500 to-fuchsia-600",
    "from-cyan-500 to-sky-600",
    "from-lime-500 to-emerald-600",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
}

export function TeamCard({ team, className }: TeamCardProps) {
  const playerCount = team._count?.players ?? team.players?.length ?? 0;
  const initial = (team.name?.[0] || "T").toUpperCase();
  const sport = team.sport ? SPORT_META[team.sport] : undefined;

  return (
    <Link href={`/teams/${team.id}`} className="group block">
      <Card className={cn("overflow-hidden p-4 transition-all hover:shadow-md hover:-translate-y-0.5", className)}>
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
            {team.logo ? (
              <img src={team.logo} alt={team.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center bg-gradient-to-br text-lg font-bold text-white",
                  gradientFor(team.name),
                )}
              >
                {initial}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 font-semibold tracking-tight group-hover:text-primary">
              {team.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{team.district || team.address || "Bangladesh"}</span>
            </p>
          </div>
          {sport && <span className="text-xl" title={sport.label}>{sport.emoji}</span>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary/70" />
            <span className="font-semibold text-foreground">{playerCount}</span> players
          </div>
          {team.captain && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
              <span className="line-clamp-1">{team.captain}</span>
            </div>
          )}
          {!team.captain && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldQuestion className="h-3.5 w-3.5" />
              <span className="line-clamp-1">No captain</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
