import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { formatDateTime } from "@/lib/helpers";
import { MATCH_STATUS, MATCH_STATUS_META, RESULT_STATUS_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: MATCH_STATUS.SCHEDULED, label: "Scheduled" },
  { value: MATCH_STATUS.LIVE, label: "Live" },
  { value: MATCH_STATUS.COMPLETED, label: "Completed" },
  { value: MATCH_STATUS.CANCELLED, label: "Cancelled" },
];

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status || "ALL";

  const where: any = {};
  if (statusFilter !== "ALL") where.status = statusFilter;

  const matches = await db.match.findMany({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
      tournament: { select: { id: true, name: true, sport: true } },
      venue: { select: { id: true, name: true, district: true } },
      assignment: { include: { referee: { include: { user: { select: { id: true, name: true } } } } } },
    },
    orderBy: { matchDate: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matches"
        description="All fixtures and results across every tournament on the platform."
      />

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link key={f.value} href={`/admin/matches?status=${f.value}`}>
            <StatusBadge label={f.label} color={statusFilter === f.value ? "primary" : "secondary"} />
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {matches.length === 0 ? (
            <EmptyState title="No matches" description="No matches match the current filter." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead className="hidden md:table-cell">Tournament</TableHead>
                    <TableHead className="hidden lg:table-cell">Venue</TableHead>
                    <TableHead className="hidden lg:table-cell">Referee</TableHead>
                    <TableHead className="hidden xl:table-cell">When</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {m.matchCode ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {m.homeTeam?.name ?? "TBD"}
                              <span className="mx-2 text-muted-foreground">vs</span>
                              {m.awayTeam?.name ?? "TBD"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {m.homeScore} - {m.awayScore}
                              {m.tournament?.sport === "CRICKET" && m.homeRuns != null && (
                                <span> · {m.homeRuns}/{m.homeWickets} vs {m.awayRuns}/{m.awayWickets}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{m.tournament?.name ?? "—"}</p>
                          {m.tournament && <SportBadge sport={m.tournament.sport} />}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {m.venue ? (
                          <div className="min-w-0">
                            <p className="truncate">{m.venue.name}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{m.venue.district}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">TBD</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {m.assignment?.referee?.user?.name ?? <span className="text-amber-600 dark:text-amber-400">Unassigned</span>}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                        {m.matchDate ? formatDateTime(m.matchDate) : "TBD"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={MATCH_STATUS_META[m.status]?.label ?? m.status}
                          color={MATCH_STATUS_META[m.status]?.color ?? "secondary"}
                          dot
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={RESULT_STATUS_META[m.resultStatus]?.label ?? m.resultStatus}
                          color={RESULT_STATUS_META[m.resultStatus]?.color ?? "secondary"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
