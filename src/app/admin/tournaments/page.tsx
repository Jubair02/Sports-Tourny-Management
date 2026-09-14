import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { TournamentStatusActions } from "@/components/admin/tournament-status-actions";
import { formatDate, taka } from "@/lib/helpers";
import { SPORTS, TOURNAMENT_STATUS, TOURNAMENT_STATUS_META, SPORT_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

const SPORT_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "All sports" },
  ...Object.values(SPORTS).map((s) => ({ value: s, label: SPORT_META[s]?.label ?? s })),
];

const STATUS_FILTERS = [
  { value: "ALL", label: "All statuses" },
  { value: TOURNAMENT_STATUS.PENDING_APPROVAL, label: "Pending approval" },
  { value: TOURNAMENT_STATUS.PUBLISHED, label: "Published" },
  { value: TOURNAMENT_STATUS.REGISTRATION_OPEN, label: "Registration open" },
  { value: TOURNAMENT_STATUS.ONGOING, label: "Ongoing" },
  { value: TOURNAMENT_STATUS.COMPLETED, label: "Completed" },
  { value: TOURNAMENT_STATUS.CANCELLED, label: "Cancelled" },
];

export default async function AdminTournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sport?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status || "ALL";
  const sportFilter = sp.sport || "ALL";

  const where: any = {};
  if (statusFilter !== "ALL") where.status = statusFilter;
  if (sportFilter !== "ALL") where.sport = sportFilter;

  const tournaments = await db.tournament.findMany({
    where,
    include: {
      venue: true,
      organizer: { include: { user: true } },
      _count: { select: { registrations: true, matches: true, participants: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tournaments"
        description="Review, approve, publish or cancel every tournament on the platform."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status:</span>
          {STATUS_FILTERS.map((f) => (
            <Link key={f.value} href={`/admin/tournaments?status=${f.value}&sport=${sportFilter}`}>
              <StatusBadge label={f.label} color={statusFilter === f.value ? "primary" : "secondary"} />
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sport:</span>
          {SPORT_FILTERS.map((f) => (
            <Link key={f.value} href={`/admin/tournaments?status=${statusFilter}&sport=${f.value}`}>
              <StatusBadge label={f.label} color={sportFilter === f.value ? "primary" : "secondary"} />
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {tournaments.length === 0 ? (
            <EmptyState title="No tournaments" description="No tournaments match the current filter." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead className="hidden md:table-cell">Organizer</TableHead>
                    <TableHead className="hidden lg:table-cell">Dates</TableHead>
                    <TableHead className="hidden lg:table-cell">Teams</TableHead>
                    <TableHead className="hidden xl:table-cell">Entry fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournaments.map((t) => {
                    const isPending = t.status === TOURNAMENT_STATUS.PENDING_APPROVAL;
                    return (
                      <TableRow key={t.id} className={isPending ? "bg-amber-500/5" : undefined}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{t.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {t.location || t.district || "No location"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell><SportBadge sport={t.sport} /></TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="min-w-0">
                            <p className="truncate text-sm">{t.organizer?.user?.name ?? "—"}</p>
                            <p className="truncate text-[10px] text-muted-foreground">
                              {t.organizer?.organization || t.organizer?.user?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {formatDate(t.startDate)} → {formatDate(t.endDate)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          <span className="font-medium">{t._count.participants}</span>
                          <span className="text-muted-foreground"> / {t.maxTeams}</span>
                          <span className="ml-1 text-[10px] text-muted-foreground">({t._count.registrations} reg.)</span>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs">
                          {t.entryFee > 0 ? taka(t.entryFee) : "Free"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={TOURNAMENT_STATUS_META[t.status]?.label ?? t.status}
                            color={TOURNAMENT_STATUS_META[t.status]?.color ?? "secondary"}
                            dot
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <TournamentStatusActions
                            tournamentId={t.id}
                            tournamentName={t.name}
                            currentStatus={t.status}
                            minimal={isPending}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
