import Link from "next/link";
import {
  Users, Building2, Trophy, CalendarCheck, ShieldAlert, ClipboardList, CheckCircle2, Activity,
} from "lucide-react";
import { db } from "@/lib/db";
import { getAdminStats } from "@/lib/queries";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingApprovalsPanel } from "@/components/admin/pending-approvals-panel";
import { SportBarChart, StatusDonutChart } from "@/components/admin/dashboard-charts";
import { relativeTime, formatDateTime } from "@/lib/helpers";
import { SPORT_META, TOURNAMENT_STATUS_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const [
    pendingOrganizers,
    pendingTournaments,
    tournamentsBySport,
    tournamentsByStatus,
    recentLogs,
  ] = await Promise.all([
    db.organizerProfile.findMany({
      where: { approvalStatus: "PENDING" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.tournament.findMany({
      where: { status: "PENDING_APPROVAL" },
      include: { organizer: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.tournament.groupBy({
      by: ["sport"],
      _count: { _all: true },
    }),
    db.tournament.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const pendingItems = [
    ...pendingOrganizers.map((o) => ({
      kind: "ORGANIZER" as const,
      id: o.id,
      title: o.user.name,
      subtitle: o.user.email + (o.organization ? ` · ${o.organization}` : ""),
      meta: o.district ? `District: ${o.district}` : "Awaiting review",
      createdAt: o.createdAt.toISOString(),
    })),
    ...pendingTournaments.map((t) => ({
      kind: "TOURNAMENT" as const,
      id: t.id,
      title: t.name,
      subtitle: t.organizer?.user?.name ? `by ${t.organizer.user.name}` : "",
      meta: `${SPORT_META[t.sport]?.label ?? t.sport} · ${t.maxTeams} teams max`,
      createdAt: t.createdAt.toISOString(),
    })),
  ];

  const sportChartData = tournamentsBySport.map((s) => ({
    name: SPORT_META[s.sport]?.label ?? s.sport,
    emoji: SPORT_META[s.sport]?.emoji ?? "",
    count: s._count._all,
  }));

  const statusChartData = tournamentsByStatus.map((s) => ({
    name: TOURNAMENT_STATUS_META[s.status]?.label ?? s.status,
    value: s._count._all,
    color: TOURNAMENT_STATUS_META[s.status]?.color ?? "secondary",
  }));

  const matchesPct = stats.matches > 0 ? Math.round((stats.completedMatches / stats.matches) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Platform-wide overview of users, tournaments, matches, disputes & approvals."
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Users" value={stats.users} icon={Users} accent="primary" hint="All registered accounts" />
        <StatCard label="Organizers" value={stats.organizers} icon={Building2} accent="amber" hint="Includes pending" />
        <StatCard label="Teams" value={stats.teams} icon={Users} accent="blue" />
        <StatCard label="Tournaments" value={stats.tournaments} icon={Trophy} accent="primary" />
        <StatCard label="Active Now" value={stats.activeTournaments} icon={Activity} accent="rose" hint="Ongoing tournaments" />
        <StatCard label="Completed" value={stats.completedTournaments} icon={CheckCircle2} accent="secondary" hint="Finished tournaments" />
        <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon={ShieldAlert} accent="amber" hint="Organizer applications" />
        <StatCard label="Pending Registrations" value={stats.pendingReg} icon={ClipboardList} accent="blue" hint="Team registrations" />
        <StatCard label="Open Disputes" value={stats.disputes} icon={ShieldAlert} accent="rose" />
        <StatCard label="Matches Done" value={`${stats.completedMatches}/${stats.matches}`} icon={CalendarCheck} accent="primary" hint={`${matchesPct}% completed`} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tournaments by Sport</CardTitle>
          </CardHeader>
          <CardContent>
            <SportBarChart data={sportChartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tournament Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={statusChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Pending approvals + Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Pending Approvals
              <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {pendingItems.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendingApprovalsPanel items={pendingItems} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link href="/admin/audit-logs" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <EmptyState title="No activity yet" description="Audit logs will appear here." />
            ) : (
              <ul className="max-h-96 space-y-3 overflow-y-auto scrollbar-thin pr-1">
                {recentLogs.map((log) => (
                  <li key={log.id} className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-tight">
                        <span className="font-medium">{log.user?.name ?? "System"}</span>
                        <span className="text-muted-foreground"> · {log.action.toLowerCase().replace(/_/g, " ")}</span>
                      </p>
                      {log.detail && (
                        <p className="truncate text-xs text-muted-foreground">{log.detail}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground" title={formatDateTime(log.createdAt)}>
                        {relativeTime(log.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

