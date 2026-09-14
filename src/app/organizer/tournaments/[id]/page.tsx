import Link from "next/link";
import {
  ArrowRight, CalendarDays, ClipboardCheck, Users, MapPin, Flag, Trophy,
  Megaphone, Settings, BarChart3, ShieldAlert, Info as InfoIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { StatusWorkflowActions } from "@/components/organizer/status-workflow-actions";
import {
  TOURNAMENT_STATUS, TOURNAMENT_STATUS_META, FORMAT_META, SPORT_META,
} from "@/lib/constants";
import { formatDate, formatDateTime, taka } from "@/lib/helpers";

export const dynamic = "force-dynamic";

const NAV_CARDS = [
  { href: "registrations", label: "Registrations", icon: ClipboardCheck, desc: "Approve or reject team applications" },
  { href: "fixtures", label: "Fixtures", icon: CalendarDays, desc: "Generate & schedule matches" },
  { href: "matches", label: "Matches", icon: Trophy, desc: "All matches & live status" },
  { href: "results", label: "Results", icon: BarChart3, desc: "Approve submitted results" },
  { href: "standings", label: "Standings", icon: BarChart3, desc: "Live points table" },
  { href: "teams", label: "Teams", icon: Users, desc: "Approved participating teams" },
  { href: "referees", label: "Referees", icon: Flag, desc: "Directory & assignments" },
  { href: "venues", label: "Venues", icon: MapPin, desc: "Match venues" },
  { href: "announcements", label: "Announcements", icon: Megaphone, desc: "Publish updates to teams" },
  { href: "settings", label: "Settings", icon: Settings, desc: "Edit tournament & status workflow" },
];

const STATUS_STEPS = [
  TOURNAMENT_STATUS.DRAFT,
  TOURNAMENT_STATUS.PENDING_APPROVAL,
  TOURNAMENT_STATUS.PUBLISHED,
  TOURNAMENT_STATUS.REGISTRATION_OPEN,
  TOURNAMENT_STATUS.REGISTRATION_CLOSED,
  TOURNAMENT_STATUS.ONGOING,
  TOURNAMENT_STATUS.COMPLETED,
];

export default async function TournamentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  // Ownership: ADMIN bypasses; ORGANIZER must own via profile
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });

  const tournament = await db.tournament.findUnique({
    where: { id },
    include: {
      venue: true,
      organizer: { include: { user: true } },
      _count: { select: { registrations: true, matches: true, participants: true, announcements: true } },
    },
  });

  if (!tournament) notFound();
  if (session.role !== "ADMIN" && (!prof || prof.id !== tournament.organizerId)) notFound();

  const [
    approvedCount,
    pendingCount,
    completedMatches,
    upcomingMatches,
  ] = await Promise.all([
    db.tournamentParticipant.count({ where: { tournamentId: id } }),
    db.tournamentRegistration.count({ where: { tournamentId: id, status: "PENDING" } }),
    db.match.count({ where: { tournamentId: id, status: "COMPLETED", resultStatus: "APPROVED" } }),
    db.match.count({
      where: { tournamentId: id, status: "SCHEDULED", matchDate: { gte: new Date() } },
    }),
  ]);

  const stepIndex = STATUS_STEPS.indexOf(tournament.status as TOURNAMENT_STATUS);
  const isCancelled = tournament.status === TOURNAMENT_STATUS.CANCELLED;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tournament.name}
        description={
          isCancelled
            ? "This tournament was cancelled."
            : `${SPORT_META[tournament.sport]?.label ?? tournament.sport} · ${FORMAT_META[tournament.format]?.label ?? tournament.format}`
        }
      >
        <Button asChild variant="outline" size="sm">
          <Link href={`/tournaments/${id}`} target="_blank">
            <InfoIcon className="h-4 w-4" />
            Public view
          </Link>
        </Button>
      </PageHeader>

      {/* Status workflow stepper */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Status Workflow
            </span>
            <StatusBadge
              label={TOURNAMENT_STATUS_META[tournament.status]?.label ?? tournament.status}
              color={TOURNAMENT_STATUS_META[tournament.status]?.color ?? "secondary"}
              dot
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stepper visual */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_STEPS.map((s, i) => {
              const meta = TOURNAMENT_STATUS_META[s];
              const isCurrent = s === tournament.status;
              const isPast = i < stepIndex;
              const isCancelledStep = isCancelled;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className={
                      "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium " +
                      (isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isPast && !isCancelledStep
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    <span className={"h-1.5 w-1.5 rounded-full " + (isCurrent ? "bg-primary-foreground" : isPast && !isCancelledStep ? "bg-primary" : "bg-muted-foreground/50")} />
                    {meta?.label ?? s}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                  )}
                </div>
              );
            })}
          </div>
          {isCancelled && (
            <p className="text-xs text-destructive">
              Tournament is cancelled. Status changes are locked.
            </p>
          )}
          {!isCancelled && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Available next actions</p>
              <StatusWorkflowActions
                tournamentId={tournament.id}
                tournamentName={tournament.name}
                currentStatus={tournament.status}
                isAdmin={session.role === "ADMIN"}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Registrations" value={tournament._count.registrations} icon={ClipboardCheck} accent="amber" />
        <StatCard label="Approved Teams" value={`${approvedCount} / ${tournament.maxTeams}`} icon={Users} accent="primary" hint={`${pendingCount} pending review`} />
        <StatCard label="Matches" value={tournament._count.matches} icon={Trophy} accent="amber" />
        <StatCard label="Completed" value={completedMatches} icon={BarChart3} accent="secondary" hint={`${tournament._count.matches > 0 ? Math.round((completedMatches / tournament._count.matches) * 100) : 0}% done`} />
        <StatCard label="Upcoming" value={upcomingMatches} icon={CalendarDays} accent="rose" />
      </div>

      {/* Tournament info */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tournament Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <InfoItem label="Sport" value={<SportBadge sport={tournament.sport} />} />
            <InfoItem label="Format" value={FORMAT_META[tournament.format]?.label ?? tournament.format} />
            <InfoItem label="Category" value={tournament.category ?? "—"} />
            <InfoItem label="Start Date" value={formatDate(tournament.startDate)} />
            <InfoItem label="End Date" value={formatDate(tournament.endDate)} />
            <InfoItem label="Registration Closes" value={formatDate(tournament.regDeadline)} />
            <InfoItem label="Entry Fee" value={tournament.entryFee > 0 ? taka(tournament.entryFee) : "Free"} />
            <InfoItem label="Prize Money" value={tournament.prizeMoney || "—"} />
            <InfoItem label="Min / Max Teams" value={`${tournament.minTeams} / ${tournament.maxTeams}`} />
            <InfoItem label="Venue" value={tournament.venue?.name ?? "TBD"} />
            <InfoItem label="Location" value={tournament.location || [tournament.district, tournament.upazila].filter(Boolean).join(", ") || "—"} />
            <InfoItem label="Created" value={formatDateTime(tournament.createdAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organizer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {tournament.organizer.user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{tournament.organizer.user?.name ?? "—"}</p>
                <p className="truncate text-xs text-muted-foreground">{tournament.organizer.organization || tournament.organizer.user?.email}</p>
              </div>
            </div>
            {tournament.rules && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rules</p>
                <p className="mt-1 max-h-32 overflow-y-auto scrollbar-thin text-xs text-muted-foreground whitespace-pre-line">
                  {tournament.rules}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Manage</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {NAV_CARDS.map((c) => (
            <Link
              key={c.href}
              href={`/organizer/tournaments/${id}/${c.href}`}
              className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-4.5 w-4.5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 font-medium">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
