import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { TournamentFormDialog } from "@/components/organizer/tournament-form-dialog";
import { formatDate, taka } from "@/lib/helpers";
import {
  SPORTS, TOURNAMENT_STATUS, TOURNAMENT_STATUS_META, SPORT_META, FORMAT_META,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function OrganizerTournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sport?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;
  const statusFilter = sp.status || "ALL";
  const sportFilter = sp.sport || "ALL";

  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });

  const where: any = {};
  if (prof) where.organizerId = prof.id;
  if (statusFilter !== "ALL") where.status = statusFilter;
  if (sportFilter !== "ALL") where.sport = sportFilter;

  const tournaments = prof
    ? await db.tournament.findMany({
        where,
        include: {
          venue: true,
          _count: { select: { registrations: true, matches: true, participants: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  const isApproved = prof?.approvalStatus === "APPROVED";

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tournaments"
        description="Manage your tournaments from draft to completion."
      >
        {isApproved ? (
          <TournamentFormDialog />
        ) : (
          <span className="text-xs text-muted-foreground">Approval required to create</span>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status:</span>
        {[
          { value: "ALL", label: "All" },
          ...Object.values(TOURNAMENT_STATUS).map((s) => ({ value: s, label: TOURNAMENT_STATUS_META[s]?.label ?? s })),
        ].map((f) => (
          <Link key={f.value} href={`/organizer/tournaments?status=${f.value}&sport=${sportFilter}`}>
            <StatusBadge label={f.label} color={statusFilter === f.value ? "primary" : "secondary"} />
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sport:</span>
        {[
          { value: "ALL", label: "All sports" },
          ...Object.values(SPORTS).map((s) => ({ value: s, label: SPORT_META[s]?.label ?? s })),
        ].map((f) => (
          <Link key={f.value} href={`/organizer/tournaments?status=${statusFilter}&sport=${f.value}`}>
            <StatusBadge label={f.label} color={sportFilter === f.value ? "primary" : "secondary"} />
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {tournaments.length === 0 ? (
            <EmptyState
              title="No tournaments found"
              description={isApproved ? "Create your first tournament to get started." : "You need organizer approval to create tournaments."}
              action={isApproved ? <TournamentFormDialog /> : undefined}
            />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead className="hidden md:table-cell">Format</TableHead>
                    <TableHead className="hidden lg:table-cell">Dates</TableHead>
                    <TableHead className="hidden lg:table-cell">Teams</TableHead>
                    <TableHead className="hidden xl:table-cell">Entry fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournaments.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell>
                        <Link href={`/organizer/tournaments/${t.id}`} className="block">
                          <div className="min-w-0">
                            <p className="truncate font-medium hover:text-primary">{t.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {t.location || t.district || "No location"}
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell><SportBadge sport={t.sport} /></TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {FORMAT_META[t.format]?.label ?? t.format}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDate(t.startDate)} → {formatDate(t.endDate)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        <span className="font-medium">{t._count.participants}</span>
                        <span className="text-muted-foreground"> / {t.maxTeams}</span>
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
                        <Link href={`/organizer/tournaments/${t.id}`} className="text-xs text-primary hover:underline">
                          Manage →
                        </Link>
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
