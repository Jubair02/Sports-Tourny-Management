import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  DISPUTE_TYPE_META, DISPUTE_STATUS_META,
} from "@/lib/constants";
import { formatDateTime, relativeTime } from "@/lib/helpers";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganizerDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;
  const filter = sp.status || "ALL";

  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });

  const tournamentIds = prof
    ? (await db.tournament.findMany({ where: { organizerId: prof.id }, select: { id: true, name: true } })).map((t) => ({ id: t.id, name: t.name }))
    : [];
  const ids = tournamentIds.map((t) => t.id);

  if (ids.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Disputes" description="Disputes raised against your tournaments." />
        <EmptyState icon={ShieldAlert} title="No tournaments yet" description="Disputes against your tournaments will appear here." />
      </div>
    );
  }

  // CRITICAL: Dispute model has NO relations — only tournamentId/matchId plain String columns.
  // Fetch disputes first, then resolve tournament/match names via separate findMany calls.
  const where: any = { tournamentId: { in: ids } };
  if (filter !== "ALL") where.status = filter;

  const disputes = await db.dispute.findMany({
    where,
    include: {
      raisedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const matchIds = Array.from(
    new Set(disputes.map((d) => d.matchId).filter(Boolean) as string[]),
  );

  const matches = matchIds.length
    ? await db.match.findMany({
        where: { id: { in: matchIds } },
        select: {
          id: true, matchCode: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      })
    : [];

  const tournamentMap = new Map(tournamentIds.map((t) => [t.id, t.name]));
  const matchMap = new Map(matches.map((m) => [m.id, m]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        description="Disputes raised by team managers against your tournaments."
      />

      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"].map((s) => (
          <Link key={s} href={`/organizer/disputes?status=${s}`}>
            <StatusBadge label={s === "ALL" ? "All" : DISPUTE_STATUS_META[s]?.label ?? s} color={filter === s ? "primary" : "secondary"} />
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {disputes.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No disputes" description="No disputes have been raised against your tournaments." />
          ) : (
            <div className="max-h-[75vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Tournament</TableHead>
                    <TableHead className="hidden xl:table-cell">Match</TableHead>
                    <TableHead className="hidden md:table-cell">Raised by</TableHead>
                    <TableHead className="hidden xl:table-cell">When</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((d) => {
                    const tournament = d.tournamentId ? tournamentMap.get(d.tournamentId) : null;
                    const match = d.matchId ? matchMap.get(d.matchId) : null;
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{d.title}</p>
                            <p className="truncate text-xs text-muted-foreground line-clamp-1">{d.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          {DISPUTE_TYPE_META[d.type] ?? d.type}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          {tournament ? (
                            <Link href={`/organizer/tournaments/${d.tournamentId}`} className="hover:text-primary">
                              {tournament}
                            </Link>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                          {match ? `${match.matchCode ?? ""} ${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"}` : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          <p>{d.raisedBy?.name ?? "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{d.raisedBy?.email}</p>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground" title={formatDateTime(d.createdAt)}>
                          {relativeTime(d.createdAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge label={DISPUTE_STATUS_META[d.status]?.label ?? d.status} color={DISPUTE_STATUS_META[d.status]?.color ?? "secondary"} dot />
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

      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p>
          <strong>Note:</strong> Disputes are resolved centrally by platform admins.
          To escalate or provide context, contact support through your profile.
        </p>
      </div>
    </div>
  );
}
