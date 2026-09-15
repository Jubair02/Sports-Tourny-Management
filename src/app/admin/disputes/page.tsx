import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { DisputesListClient } from "@/components/admin/disputes-list-client";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status || "ALL";

  const where: any = {};
  if (statusFilter !== "ALL") where.status = statusFilter;

  // NOTE: Dispute model in schema.prisma stores `tournamentId` and `matchId` as
  // plain String? columns — there is NO `tournament`/`match` relation declared.
  // So we fetch the disputes first, then resolve related tournaments/matches
  // manually via separate findMany calls and join them in JS.
  const disputes = await db.dispute.findMany({
    where,
    include: {
      raisedBy: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const tournamentIds = Array.from(
    new Set(disputes.map((d) => d.tournamentId).filter(Boolean) as string[]),
  );
  const matchIds = Array.from(
    new Set(disputes.map((d) => d.matchId).filter(Boolean) as string[]),
  );

  const [tournaments, matches] = await Promise.all([
    tournamentIds.length
      ? db.tournament.findMany({
          where: { id: { in: tournamentIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    matchIds.length
      ? db.match.findMany({
          where: { id: { in: matchIds } },
          select: {
            id: true,
            matchCode: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        })
      : Promise.resolve(
          [] as {
            id: string;
            matchCode: string | null;
            homeTeam: { name: string } | null;
            awayTeam: { name: string } | null;
          }[],
        ),
  ]);

  const tournamentMap = new Map(tournaments.map((t) => [t.id, t]));
  const matchMap = new Map(matches.map((m) => [m.id, m]));

  const serializable = disputes.map((d) => {
    const tournament = d.tournamentId ? tournamentMap.get(d.tournamentId) ?? null : null;
    const match = d.matchId ? matchMap.get(d.matchId) ?? null : null;
    return {
      id: d.id,
      type: d.type,
      title: d.title,
      description: d.description,
      status: d.status,
      resolution: d.resolution,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      raisedBy: d.raisedBy,
      tournament: tournament ? { id: tournament.id, name: tournament.name } : null,
      match: match
        ? {
            id: match.id,
            matchCode: match.matchCode,
            homeTeam: match.homeTeam ? { name: match.homeTeam.name } : null,
            awayTeam: match.awayTeam ? { name: match.awayTeam.name } : null,
          }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        description="Review and resolve disputes raised by users on tournaments & matches."
      />

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link key={f.value} href={`/admin/disputes?status=${f.value}`}>
            <StatusBadge label={f.label} color={statusFilter === f.value ? "primary" : "secondary"} />
          </Link>
        ))}
      </div>

      <Card>
        <CardContent>
          {serializable.length === 0 ? (
            <EmptyState title="No disputes" description="No disputes match the current filter." />
          ) : (
            <DisputesListClient disputes={serializable} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
