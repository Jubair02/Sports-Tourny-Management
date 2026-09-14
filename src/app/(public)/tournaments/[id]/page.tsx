import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays, MapPin, Users, Trophy, Wallet, Building2, Megaphone,
  UserCircle, Phone, Mail, Info, ArrowLeft, ShieldCheck, Banknote,
  CheckCircle2, ClipboardList, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getTournamentById } from "@/lib/public-queries";
import {
  FORMAT_META, CATEGORY_META, TOURNAMENT_STATUS_META,
  REG_STATUS_META, SPORT_META,
} from "@/lib/constants";
import { formatDate, formatDateTime, taka } from "@/lib/helpers";
import { sportBanner } from "@/components/public/images";
import { SportBadge } from "@/components/shared/sport-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/page-elements";
import { TournamentTabs } from "@/components/public/tournament-tabs";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTournamentById(id);
  if (!t) notFound();

  const statusMeta = TOURNAMENT_STATUS_META[t.status];
  const formatMeta = t.format ? FORMAT_META[t.format] : undefined;
  const banner = t.banner || sportBanner(t.sport);
  const organizerName = t.organizer?.organization || t.organizer?.user?.name || "—";
  const approvedTeams = t.registrations.filter((r) => r.status === "APPROVED");
  const pendingTeams = t.registrations.filter((r) => r.status === "PENDING");
  const approvedCount = approvedTeams.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <Link href="/tournaments"><ArrowLeft className="h-4 w-4" /> All tournaments</Link>
      </Button>

      {/* BANNER */}
      <Card className="overflow-hidden p-0 py-0">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted sm:aspect-[3/1]">
          <img src={banner} alt={t.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 text-white sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <SportBadge sport={t.sport} />
              {statusMeta && <StatusBadge label={statusMeta.label} color={statusMeta.color} dot={t.status === "ONGOING"} />}
              {formatMeta && <Badge variant="secondary" className="bg-white/20 text-white">{formatMeta.label}</Badge>}
              {t.category && <Badge variant="secondary" className="bg-white/20 text-white">{CATEGORY_META[t.category] ?? t.category}</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">
              {t.name}
            </h1>
            <p className="mt-1 text-sm text-white/85">
              by {organizerName}
              {" · "}
              {[t.upazila, t.district, t.division].filter(Boolean).join(", ") || t.location || "Bangladesh"}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick action bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {t.status === "REGISTRATION_OPEN" && (
          <Button asChild>
            <Link href="/register"><UserCircle className="h-4 w-4" /> Register a team</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={`/tournaments/${t.id}/fixtures`}><CalendarDays className="h-4 w-4" /> Fixtures</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/tournaments/${t.id}/standings`}><Trophy className="h-4 w-4" /> Standings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/tournaments/${t.id}/teams`}><Users className="h-4 w-4" /> Teams</Link>
        </Button>
      </div>

      {/* TABS */}
      <div className="mt-6">
        <TournamentTabs base={`/tournaments/${t.id}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* DESCRIPTION */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">About this tournament</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {t.description}
            </p>

            {t.rules && (
              <div className="mt-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ClipboardList className="h-4 w-4 text-primary" /> Rules &amp; Regulations
                </h3>
                <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/40 p-4 text-xs text-muted-foreground">
                  {t.rules}
                </p>
              </div>
            )}
          </Card>

          {/* KEY INFO GRID */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">Key information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoItem icon={CalendarDays} label="Start date" value={formatDate(t.startDate)} />
              <InfoItem icon={CalendarDays} label="End date" value={formatDate(t.endDate)} />
              <InfoItem icon={CalendarDays} label="Registration opens" value={formatDateTime(t.regStart)} />
              <InfoItem icon={CalendarDays} label="Registration closes" value={formatDateTime(t.regDeadline)} />
              <InfoItem icon={Users} label="Max teams" value={String(t.maxTeams)} />
              <InfoItem icon={Users} label="Min teams" value={String(t.minTeams)} />
              <InfoItem icon={Wallet} label="Entry fee" value={t.entryFee ? taka(t.entryFee) : "Free"} />
              <InfoItem icon={Trophy} label="Prize" value={t.prizeMoney || "—"} />
              {t.gender && <InfoItem icon={Users} label="Gender" value={t.gender.toLowerCase()} />}
              {t.ageCategory && <InfoItem icon={Users} label="Age category" value={t.ageCategory} />}
            </div>

            <Separator className="my-5" />

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-muted-foreground">Approved teams:</span>
                <Badge variant="secondary" className="font-semibold">
                  {approvedCount} / {t.maxTeams}
                </Badge>
              </div>
              {pendingTeams.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-amber-500" />
                  <span className="text-muted-foreground">Pending:</span>
                  <Badge variant="secondary">{pendingTeams.length}</Badge>
                </div>
              )}
            </div>
          </Card>

          {/* ANNOUNCEMENTS */}
          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Megaphone className="h-5 w-5 text-primary" /> Announcements
            </h2>
            {t.announcements.length === 0 ? (
              <div className="mt-3">
                <EmptyState icon={Megaphone} title="No announcements yet" />
              </div>
            ) : (
              <div className="mt-4 space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                {t.announcements.map((a) => (
                  <div key={a.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 font-medium">
                        {a.pinned && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                        {a.title}
                      </p>
                      <span className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-line">{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* ORGANIZER */}
          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <UserCircle className="h-4 w-4 text-primary" /> Organizer
            </h3>
            <div className="mt-3 space-y-1.5">
              <p className="font-semibold text-base">{organizerName}</p>
              <p className="text-xs text-muted-foreground">
                {t.organizer?.bio ?? "Organizer of this event."}
              </p>
              <div className="space-y-1 pt-2 text-xs">
                {t.organizer?.phone && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" /> {t.organizer.phone}
                  </p>
                )}
                {t.organizer?.district && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {t.organizer.district}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* VENUE */}
          {t.venue && (
            <Card className="overflow-hidden p-0 py-0">
              {t.venue.image && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img src={t.venue.image} alt={t.venue.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4 text-primary" /> Venue
                </h3>
                <p className="mt-2 font-medium">{t.venue.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[t.venue.upazila, t.venue.district, t.venue.division].filter(Boolean).join(", ")}
                </p>
                {t.venue.address && (
                  <p className="mt-1 text-xs text-muted-foreground">{t.venue.address}</p>
                )}
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link href={`/venues/${t.venue.id}`}>View venue</Link>
                </Button>
              </div>
            </Card>
          )}

          {/* APPROVED TEAMS */}
          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Approved teams
              <Badge variant="secondary" className="ml-auto">{approvedCount}</Badge>
            </h3>
            {approvedTeams.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No teams approved yet.</p>
            ) : (
              <div className="mt-3 space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
                {approvedTeams.map((r) => (
                  <Link
                    key={r.id}
                    href={`/teams/${r.team.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2 text-sm transition-colors hover:bg-accent/50"
                  >
                    <span className="line-clamp-1 font-medium">{r.team.name}</span>
                    <Badge variant="outline" className="text-[10px]">{REG_STATUS_META.APPROVED.label}</Badge>
                  </Link>
                ))}
              </div>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
              <Link href={`/tournaments/${t.id}/teams`}>View all teams</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
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
