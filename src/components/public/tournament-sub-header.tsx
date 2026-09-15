import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { TOURNAMENT_STATUS_META, FORMAT_META } from "@/lib/constants";
import { formatDate } from "@/lib/helpers";
import { TournamentTabs } from "./tournament-tabs";

type T = {
  id: string;
  name: string;
  sport: string;
  status: string;
  format?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  district?: string | null;
  location?: string | null;
};

export function TournamentSubHeader({ t }: { t: T }) {
  const statusMeta = TOURNAMENT_STATUS_META[t.status];
  const formatMeta = t.format ? FORMAT_META[t.format] : undefined;
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <Link href="/tournaments"><ArrowLeft className="h-4 w-4" /> All tournaments</Link>
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SportBadge sport={t.sport} />
            {statusMeta && <StatusBadge label={statusMeta.label} color={statusMeta.color} />}
            {formatMeta && <Badge variant="secondary">{formatMeta.label}</Badge>}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t.name}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(t.startDate)} — {formatDate(t.endDate)}
            {(t.district || t.location) && (
              <> · {t.location || t.district}</>
            )}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/tournaments/${t.id}`}>Overview</Link>
        </Button>
      </div>
      <div className="mt-4">
        <TournamentTabs base={`/tournaments/${t.id}`} />
      </div>
    </div>
  );
}
