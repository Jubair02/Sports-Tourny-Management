import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getRefereeProfile } from "@/lib/queries";
import { PageHeader, StatCard, EmptyState, SectionHeading } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import {
  CalendarDays, Clock, MapPin, ArrowRight, ClipboardCheck, CheckCircle2, Flag, Trophy, Award,
} from "lucide-react";
import { formatDateTime, formatTime, formatDate } from "@/lib/helpers";
import { RESULT_STATUS_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function RefereeOverviewPage() {
  const session = await getSession();
  let profile = session ? await getRefereeProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.refereeProfile.findFirst({ include: { user: true } });
  }
  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Referee Dashboard" description="View your match assignments and submit results." />
        <EmptyState
          icon={Flag}
          title="No referee profile found"
          description="Your account is not linked to a referee profile. Please contact an administrator."
        />
      </div>
    );
  }

  const assignments = await db.refereeAssignment.findMany({
    where: { refereeId: profile.id },
    include: {
      match: {
        include: {
          homeTeam: true,
          awayTeam: true,
          tournament: true,
          venue: true,
          events: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  const matches = assignments.map((a) => a.match).filter(Boolean);
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const upcoming = matches.filter(
    (m) => m.status === "SCHEDULED" && m.matchDate && m.matchDate >= now
  );
  const todays = matches.filter(
    (m) => m.matchDate && m.matchDate >= startOfToday && m.matchDate <= endOfToday
  );
  const completed = matches.filter((m) => m.status === "COMPLETED");
  const pendingResults = matches.filter(
    (m) =>
      (m.status === "SCHEDULED" || m.status === "LIVE") &&
      m.resultStatus !== "SUBMITTED" &&
      m.resultStatus !== "APPROVED"
  );

  // Next match — the earliest upcoming
  const sortedUpcoming = [...upcoming].sort((a, b) => {
    const ad = a.matchDate ? a.matchDate.getTime() : Number.MAX_SAFE_INTEGER;
    const bd = b.matchDate ? b.matchDate.getTime() : Number.MAX_SAFE_INTEGER;
    return ad - bd;
  });
  const nextMatch = sortedUpcoming[0] ?? null;

  // Recent submitted
  const recentSubmitted = matches
    .filter((m) => m.resultStatus === "SUBMITTED" || m.resultStatus === "APPROVED")
    .sort((a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referee Dashboard"
        description={`Welcome, ${profile.user?.name ?? "Referee"}. Here are your assignments.`}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Assignments" value={assignments.length} icon={ClipboardCheck} accent="primary" />
        <StatCard label="Upcoming" value={upcoming.length} icon={CalendarDays} accent="amber" />
        <StatCard label="Today" value={todays.length} icon={Clock} accent="blue" />
        <StatCard label="Pending Results" value={pendingResults.length} icon={Flag} accent="rose" />
        <StatCard label="Completed" value={completed.length} icon={CheckCircle2} accent="secondary" />
      </div>

      {/* Next match highlight */}
      {nextMatch && (
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-amber-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Flag className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">Next Match</p>
                </div>
                <h3 className="text-lg font-bold sm:text-xl">
                  {nextMatch.homeTeam?.name ?? "TBD"} <span className="text-muted-foreground">vs</span>{" "}
                  {nextMatch.awayTeam?.name ?? "TBD"}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDateTime(nextMatch.matchDate)}</span>
                  {nextMatch.venue?.name && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {nextMatch.venue.name}</span>}
                  <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> {nextMatch.tournament.name}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <SportBadge sport={nextMatch.tournament.sport} />
                <Link
                  href={`/referee/matches/${nextMatch.id}`}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Submit Result <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pending results */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4 text-rose-500" /> Pending Results
            </CardTitle>
            <Link href="/referee/submit" className="text-xs text-primary hover:underline">Submit</Link>
          </CardHeader>
          <CardContent>
            {pendingResults.length === 0 ? (
              <EmptyState title="No pending results" description="You're all caught up." />
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                {pendingResults.slice(0, 6).map((m) => (
                  <li key={m.id}>
                    <Link href={`/referee/matches/${m.id}`} className="block rounded-lg border p-3 hover:bg-accent/60">
                      <div className="flex items-center justify-between gap-2">
                        <SportBadge sport={m.tournament.sport} />
                        <span className="text-[10px] text-muted-foreground">{m.tournament.name}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium">
                        {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(m.matchDate)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent submitted */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Recent Submissions
            </CardTitle>
            <Link href="/referee/history" className="text-xs text-primary hover:underline">History</Link>
          </CardHeader>
          <CardContent>
            {recentSubmitted.length === 0 ? (
              <EmptyState title="No submissions yet" description="Submit your first match result to see it here." />
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                {recentSubmitted.map((m) => {
                  const meta = RESULT_STATUS_META[m.resultStatus] ?? { label: m.resultStatus, color: "secondary" };
                  return (
                    <li key={m.id}>
                      <Link href={`/referee/matches/${m.id}`} className="block rounded-lg border p-3 hover:bg-accent/60">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                          </span>
                          <StatusBadge label={meta.label} color={meta.color} dot />
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(m.matchDate)}</p>
                        {m.playerOfMatch && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                            <Award className="h-3 w-3" /> {m.playerOfMatch}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <SectionHeading title="Today's Matches" />
      {todays.length === 0 ? (
        <EmptyState icon={Clock} title="No matches today" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {todays.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <SportBadge sport={m.tournament.sport} />
                  <span className="text-[10px] text-muted-foreground">{formatTime(m.matchDate)}</span>
                </div>
                <p className="text-sm font-medium">
                  {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                </p>
                <p className="text-xs text-muted-foreground">{m.tournament.name}</p>
                <Link
                  href={`/referee/matches/${m.id}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
