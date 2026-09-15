import Link from "next/link";
import {
  Trophy, Activity, CheckCircle2, Users, ClipboardList, CalendarDays, ShieldAlert,
  Plus, ArrowRight, Clock, BadgeCheck, AlertCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader, StatCard, EmptyState, SectionHeading } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { RegActionsButton } from "@/components/organizer/reg-actions-button";
import { TournamentFormDialog } from "@/components/organizer/tournament-form-dialog";
import {
  TOURNAMENT_STATUS, TOURNAMENT_STATUS_META,
  REG_STATUS_META, ORGANIZER_APPROVAL,
} from "@/lib/constants";
import { formatDate, formatDateTime, relativeTime } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function OrganizerOverviewPage() {
  const session = await getSession();
  if (!session) return null;

  // For ADMIN: fall back to first approved organizer profile so dashboard has data
  let prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" }, include: { user: true } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id }, include: { user: true } });

  const isAdmin = session.role === "ADMIN";
  const isApproved = prof?.approvalStatus === ORGANIZER_APPROVAL.APPROVED;

  const tournaments = prof
    ? await db.tournament.findMany({
        where: { organizerId: prof.id },
        include: {
          venue: true,
          _count: { select: { registrations: true, matches: true, participants: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  const tournamentIds = tournaments.map((t) => t.id);

  const [
    pendingRegs,
    approvedTeams,
    matchesCount,
    completedMatches,
    upcomingMatches,
  ] = await Promise.all([
    tournamentIds.length
      ? db.tournamentRegistration.findMany({
          where: { tournamentId: { in: tournamentIds }, status: "PENDING" },
          include: {
            team: { include: { manager: { include: { user: true } }, _count: { select: { players: true } } } },
            tournament: { select: { name: true, sport: true } },
          },
          orderBy: { registeredAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    tournamentIds.length
      ? db.tournamentParticipant.count({ where: { tournamentId: { in: tournamentIds } } })
      : Promise.resolve(0),
    tournamentIds.length
      ? db.match.count({ where: { tournamentId: { in: tournamentIds } } })
      : Promise.resolve(0),
    tournamentIds.length
      ? db.match.count({ where: { tournamentId: { in: tournamentIds }, status: "COMPLETED", resultStatus: "APPROVED" } })
      : Promise.resolve(0),
    tournamentIds.length
      ? db.match.findMany({
          where: { tournamentId: { in: tournamentIds }, status: "SCHEDULED", matchDate: { gte: new Date() } },
          include: { homeTeam: true, awayTeam: true, tournament: true },
          orderBy: { matchDate: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  const totalRegs = tournaments.reduce((sum, t) => sum + t._count.registrations, 0);
  const activeTournaments = tournaments.filter((t) => t.status === TOURNAMENT_STATUS.ONGOING).length;
  const completedTournaments = tournaments.filter((t) => t.status === TOURNAMENT_STATUS.COMPLETED).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? "Organizer Overview (Admin preview)" : "Organizer Overview"}
        description={
          prof
            ? `Welcome back, ${prof.user?.name ?? session.name}. Manage your tournaments, registrations, fixtures, and results.`
            : "Organizer profile not found."
        }
      >
        {isApproved ? (
          <TournamentFormDialog />
        ) : (
          <Button disabled size="sm">
            <Plus className="h-4 w-4" />
            New Tournament
          </Button>
        )}
      </PageHeader>

      {/* Approval banner */}
      {prof && !isApproved && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">
                  {prof.approvalStatus === ORGANIZER_APPROVAL.PENDING
                    ? "Approval Pending"
                    : "Approval Rejected"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {prof.approvalStatus === ORGANIZER_APPROVAL.PENDING
                    ? "Your organizer account is awaiting admin approval. You cannot create or publish tournaments until approved."
                    : `Your organizer application was rejected.${prof.rejectionReason ? ` Reason: ${prof.rejectionReason}` : ""}`}
                </p>
              </div>
            </div>
            {prof.approvalStatus === ORGANIZER_APPROVAL.REJECTED && (
              <Button asChild variant="outline" size="sm">
                <Link href="/organizer/settings">Contact Admin</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="My Tournaments" value={tournaments.length} icon={Trophy} accent="primary" />
        <StatCard label="Active Tournaments" value={activeTournaments} icon={Activity} accent="rose" hint="Status: Ongoing" />
        <StatCard label="Completed" value={completedTournaments} icon={CheckCircle2} accent="secondary" />
        <StatCard label="Approved Teams" value={approvedTeams} icon={Users} accent="primary" />
        <StatCard label="Total Registrations" value={totalRegs} icon={ClipboardList} accent="amber" />
        <StatCard label="Pending Registrations" value={pendingRegs.length} icon={ClipboardList} accent="rose" hint="Awaiting review" />
        <StatCard label="Matches" value={matchesCount} icon={CalendarDays} accent="amber" />
        <StatCard label="Completed Matches" value={completedMatches} icon={BadgeCheck} accent="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent tournaments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Tournaments</CardTitle>
            <Link href="/organizer/tournaments" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {tournaments.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Trophy}
                  title="No tournaments yet"
                  description={isApproved ? "Create your first tournament to get started." : "Once approved, you can create tournaments."}
                  action={isApproved ? <TournamentFormDialog /> : undefined}
                />
              </div>
            ) : (
              <div className="max-h-96 divide-y overflow-y-auto scrollbar-thin">
                {tournaments.slice(0, 8).map((t) => (
                  <Link
                    key={t.id}
                    href={`/organizer/tournaments/${t.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.location || t.district || "No location"} · {formatDate(t.startDate)}
                      </p>
                    </div>
                    <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                      <span className="font-medium text-foreground">{t._count.participants}</span> / {t.maxTeams} teams
                    </div>
                    <SportBadge sport={t.sport} />
                    <StatusBadge
                      label={TOURNAMENT_STATUS_META[t.status]?.label ?? t.status}
                      color={TOURNAMENT_STATUS_META[t.status]?.color ?? "secondary"}
                      dot
                    />
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending registrations */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Registrations to review
            </CardTitle>
            {pendingRegs.length > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {pendingRegs.length}
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {pendingRegs.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={CheckCircle2}
                  title="All caught up"
                  description="No pending registrations across your tournaments."
                />
              </div>
            ) : (
              <div className="max-h-96 divide-y overflow-y-auto scrollbar-thin">
                {pendingRegs.map((r) => (
                  <div key={r.id} className="space-y-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.team.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.tournament.name} · {r.team._count.players} players
                        </p>
                        <p className="text-[10px] text-muted-foreground" title={formatDateTime(r.registeredAt)}>
                          {relativeTime(r.registeredAt)}
                        </p>
                      </div>
                      <SportBadge sport={r.tournament.sport} />
                    </div>
                    <RegActionsButton
                      tournamentId={r.tournamentId}
                      regId={r.id}
                      teamName={r.team.name}
                      currentStatus={r.status}
                      compact
                    />
                  </div>
                ))}
                <div className="px-4 py-3">
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link href="/organizer/registrations">See all registrations</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming matches */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Upcoming Matches</CardTitle>
          <Link href="/organizer/fixtures" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {upcomingMatches.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={CalendarDays} title="No upcoming matches" description="Generate fixtures once registration closes." />
            </div>
          ) : (
            <div className="max-h-72 divide-y overflow-y-auto scrollbar-thin">
              {upcomingMatches.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.tournament.name}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{formatDate(m.matchDate)}</p>
                    <p>{m.venueId ? "" : "Venue TBD"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
