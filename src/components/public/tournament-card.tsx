import Link from "next/link";
import { MapPin, CalendarDays, Users, Trophy, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SportBadge } from "@/components/shared/sport-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  TOURNAMENT_STATUS_META,
  FORMAT_META,
} from "@/lib/constants";
import { formatDate, taka } from "@/lib/helpers";
import { sportBanner, pickImage, TOURNAMENT_BANNERS } from "./images";

type TournamentCardProps = {
  tournament: {
    id: string;
    name: string;
    slug: string;
    sport: string;
    banner?: string | null;
    logo?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    location?: string | null;
    district?: string | null;
    division?: string | null;
    entryFee?: number | null;
    maxTeams?: number | null;
    prizeMoney?: string | null;
    format?: string | null;
    status?: string | null;
    venue?: { name: string } | null;
    organizer?: { organization?: string | null; user?: { name: string } | null } | null;
    _count?: { registrations?: number; matches?: number } | null;
  };
  className?: string;
};

export function TournamentCard({ tournament, className }: TournamentCardProps) {
  const t = tournament;
  const statusMeta = t.status ? TOURNAMENT_STATUS_META[t.status] : undefined;
  const formatMeta = t.format ? FORMAT_META[t.format] : undefined;
  const banner = t.banner || sportBanner(t.sport);
  const organizerName =
    t.organizer?.organization || t.organizer?.user?.name || "—";
  const location = t.location || t.venue?.name || t.district || "TBD";
  const registered = t._count?.registrations ?? 0;
  const max = t.maxTeams ?? 0;

  return (
    <Link href={`/tournaments/${t.id}`} className="group block">
      <Card className={cn("overflow-hidden p-0 py-0 transition-all hover:shadow-md hover:-translate-y-0.5", className)}>
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          <img
            src={banner}
            alt={t.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
            <SportBadge sport={t.sport} />
            {statusMeta && (
              <StatusBadge label={statusMeta.label} color={statusMeta.color} dot={t.status === "ONGOING" || t.status === "REGISTRATION_OPEN"} />
            )}
          </div>
          {formatMeta && (
            <Badge variant="secondary" className="absolute right-3 top-3 bg-white/90 text-foreground">
              {formatMeta.label}
            </Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="line-clamp-1 text-base font-bold tracking-tight">
              {t.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-white/80">
              by {organizerName}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary/70" />
              <span className="line-clamp-1">{location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary/70" />
              <span>
                {formatDate(t.startDate)} — {formatDate(t.endDate)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
            <Stat label="Entry" value={t.entryFee ? taka(t.entryFee) : "Free"} icon={Wallet} />
            <Stat label="Teams" value={`${registered}${max ? `/${max}` : ""}`} icon={Users} />
            <Stat
              label="Prize"
              value={t.prizeMoney ? t.prizeMoney : "—"}
              icon={Trophy}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="line-clamp-1 text-xs font-semibold text-foreground">
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// re-export so other files can pick a banner deterministically
export { pickImage, TOURNAMENT_BANNERS };
