import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile, getTeamManagerTeams } from "@/lib/queries";
import { PageHeader, StatCard, EmptyState, SectionHeading } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import {
  Users, User, Trophy, ClipboardList, CalendarDays, BarChart3,
  Bell, ArrowRight, MapPin, Clock,
} from "lucide-react";
import { formatDate, formatDateTime, relativeTime } from "@/lib/helpers";
import { REG_STATUS_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TeamOverviewPage() {
  const session = await getSession();
  if (!session) return null;

  // ADMIN: pick the first team manager profile in the system, if any, to demo
  let profile = await getTeamManagerProfile(session.id);
  if (!profile && session.role === "ADMIN") {
    profile = await db.teamManagerProfile.findFirst({ include: { user: true } });
  }
  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Team Manager Dashboard" description="Manage your teams, players, registrations and fixtures." />
        <EmptyState
          icon={User}
          title="No team manager profile found"
          description="Your account is not linked to a team manager profile yet. Please contact an administrator."
        />
      </div>
    );
  }

  const teams = await getTeamManagerTeams(profile.id);
  const teamIds = teams.map((t) => t.id);

  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [playersCount, registrations, pendingApps, upcomingMatches, recentResults, notifications] = await Promise.all([
    db.player.count({ where: { teamId: { in: teamIds } } }),
    db.tournamentRegistration.findMany({
      where: { teamId: { in: teamIds } },
      include: { tournament: true, team: true },
      orderBy: { registeredAt: "desc" },
    }),
    db.tournamentRegistration.count({
      where: { teamId: { in: teamIds }, status: { in: ["PENDING", "UNDER_REVIEW"] } },
    }),
    teamIds.length
      ? db.match.findMany({
          where: {
            OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
            status: "SCHEDULED",
            matchDate: { gte: now },
          },
          include: { homeTeam: true, awayTeam: true, tournament: true, venue: true },
          orderBy: { matchDate: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    teamIds.length
      ? db.match.findMany({
          where: {
            OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
            status: "COMPLETED",
          },
          include: { homeTeam: true, awayTeam: true, tournament: true },
          orderBy: { matchDate: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    db.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const registeredTournaments = new Set(registrations.map((r) => r.tournamentId)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Manager Dashboard"
        description={`Welcome back, ${profile.user?.name ?? "Manager"}. Here's an overview of your teams and registrations.`}
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="My Teams" value={teams.length} icon={Users} accent="primary" />
        <StatCard label="Total Players" value={playersCount} icon={User} accent="blue" />
        <StatCard label="Registered" value={registeredTournaments} icon={Trophy} accent="amber" hint="Tournaments applied" />
        <StatCard label="Pending Apps" value={pendingApps} icon={ClipboardList} accent="amber" />
        <StatCard label="Upcoming" value={upcomingMatches.length} icon={CalendarDays} accent="primary" hint="Matches" />
        <StatCard label="Results" value={recentResults.length} icon={BarChart3} accent="secondary" hint="Recent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* My Teams quick list */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">My Teams</CardTitle>
            <Link href="/team/teams" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No teams yet"
                description="Create your first team to start registering for tournaments."
                action={
                  <Link href="/team/teams" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    Create a team <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                {teams.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/team/teams/${t.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/60"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                        {t.logo ? (
                          <img src={t.logo} alt={t.name} className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.captain ? `Captain: ${t.captain} · ` : ""}
                          {t.players.length} players
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <EmptyState title="No notifications" description="You're all caught up." />
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                {notifications.map((n) => (
                  <li key={n.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground" title={formatDateTime(n.createdAt)}>
                      {relativeTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming matches */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Upcoming Matches
            </CardTitle>
            <Link href="/team/fixtures" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingMatches.length === 0 ? (
              <EmptyState title="No upcoming matches" description="Your fixtures will appear here." />
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                {upcomingMatches.map((m) => (
                  <li key={m.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <SportBadge sport={m.tournament.sport} />
                      <span className="text-[10px] text-muted-foreground">{m.tournament.name}</span>
                    </div>
                    <p className="text-sm font-medium">
                      {m.homeTeam?.name ?? "TBD"} <span className="text-muted-foreground">vs</span>{" "}
                      {m.awayTeam?.name ?? "TBD"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDateTime(m.matchDate)}
                      </span>
                      {m.venue?.name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {m.venue.name}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent registrations */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Recent Applications
            </CardTitle>
            <Link href="/team/applications" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <EmptyState title="No registrations yet" description="Apply to a tournament to get started." />
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                {registrations.slice(0, 5).map((r) => {
                  const meta = REG_STATUS_META[r.status] ?? { label: r.status, color: "secondary" };
                  return (
                    <li key={r.id} className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{r.tournament.name}</p>
                        <StatusBadge label={meta.label} color={meta.color} dot />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {r.team.name} · applied {formatDate(r.registeredAt)}
                      </p>
                      {r.rejectionReason && r.status === "REJECTED" && (
                        <p className="text-xs text-destructive">Reason: {r.rejectionReason}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <SectionHeading title="Recent Results" description="Your teams' latest completed matches." />
      {recentResults.length === 0 ? (
        <EmptyState icon={BarChart3} title="No completed matches yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentResults.map((m) => {
            const homeWon = m.homeScore > m.awayScore;
            const awayWon = m.awayScore > m.homeScore;
            return (
              <div key={m.id} className="rounded-lg border p-4 space-y-2">
                <SportBadge sport={m.tournament.sport} />
                <div className="text-xs text-muted-foreground">{m.tournament.name}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className={homeWon ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
                    {m.homeTeam?.name ?? "TBD"}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm tabular-nums">
                    {m.homeScore} - {m.awayScore}
                  </span>
                  <span className={awayWon ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
                    {m.awayTeam?.name ?? "TBD"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{formatDate(m.matchDate)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
