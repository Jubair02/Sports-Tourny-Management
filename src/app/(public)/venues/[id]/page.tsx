import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, MapPin, Users, Building2, CalendarDays, CheckCircle2, Star, Phone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState, SectionHeading } from "@/components/shared/page-elements";
import { MatchCard } from "@/components/public/match-card";
import { getVenueById } from "@/lib/queries";
import { MATCH_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/helpers";
import { pickImage as pickImg, VENUE_IMAGES as POOL } from "@/components/public/images";

function parseFacilities(s?: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  } catch {
    return s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = await getVenueById(id);
  if (!v) notFound();

  const image = v.image || pickImg(POOL, v.id);
  const facilities = parseFacilities(v.facilities);
  const upcomingMatches = v.matches.filter((m) => m.status === "SCHEDULED").slice(0, 6);
  const completedMatches = v.matches.filter((m) => m.status === "COMPLETED").slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <Link href="/venues"><ArrowLeft className="h-4 w-4" /> All venues</Link>
      </Button>

      <Card className="overflow-hidden p-0 py-0">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted">
          <img src={image} alt={v.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-8">
            <Badge className="bg-amber-500/20 text-amber-200 ring-1 ring-amber-300/30">
              <Building2 className="h-3 w-3" /> Sports venue
            </Badge>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{v.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
              <MapPin className="h-3.5 w-3.5" />
              {[v.upazila, v.district, v.division].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <InfoRow icon={Building2} label="Capacity" value={v.capacity ? v.capacity.toLocaleString() : "—"} />
          <InfoRow icon={Users} label="Matches hosted" value={String(v.matches.length)} />
          <InfoRow icon={CalendarDays} label="Tournaments" value={String(v.tournaments.length)} />
        </div>

        {v.address && (
          <div className="border-t p-5 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              <span>{v.address}</span>
            </p>
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {upcomingMatches.length > 0 && (
            <div>
              <SectionHeading title="Upcoming matches here" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {upcomingMatches.map((m) => (
                  <MatchCard key={m.id} match={m} compact />
                ))}
              </div>
            </div>
          )}

          {completedMatches.length > 0 && (
            <div>
              <SectionHeading title="Recent results here" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {completedMatches.map((m) => (
                  <MatchCard key={m.id} match={m} compact />
                ))}
              </div>
            </div>
          )}

          {upcomingMatches.length === 0 && completedMatches.length === 0 && (
            <EmptyState
              icon={CalendarDays}
              title="No matches scheduled at this venue"
              description="Check back once tournaments assign matches here."
            />
          )}
        </div>

        <div className="space-y-6">
          {/* FACILITIES */}
          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Facilities
            </h3>
            {facilities.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No facilities listed.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {facilities.map((f) => (
                  <Badge key={f} variant="secondary">{f}</Badge>
                ))}
              </div>
            )}
          </Card>

          {/* TOURNAMENTS */}
          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" /> Hosted tournaments
            </h3>
            {v.tournaments.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No tournaments hosted yet.</p>
            ) : (
              <div className="mt-3 space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {v.tournaments.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2.5 text-sm transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.startDate)} — {formatDate(t.endDate)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
