import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RegActionsButton } from "@/components/organizer/reg-actions-button";
import {
  REGISTRATION_STATUS, REG_STATUS_META, PAYMENT_METHOD_META, PAYMENT_STATUS_META,
} from "@/lib/constants";
import { formatDate, formatDateTime, taka, relativeTime } from "@/lib/helpers";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const filter = sp.status || "ALL";

  const session = await getSession();
  if (!session) return null;
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });
  const tournament = await db.tournament.findUnique({ where: { id }, select: { id: true, name: true, organizerId: true } });
  if (!tournament) notFound();
  if (session.role !== "ADMIN" && (!prof || prof.id !== tournament.organizerId)) notFound();

  const where: any = { tournamentId: id };
  if (filter !== "ALL") where.status = filter;

  const [registrations, counts] = await Promise.all([
    db.tournamentRegistration.findMany({
      where,
      include: {
        team: {
          include: {
            manager: { include: { user: true } },
            _count: { select: { players: true } },
          },
        },
      },
      orderBy: { registeredAt: "desc" },
      take: 300,
    }),
    db.tournamentRegistration.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { tournamentId: id },
    }),
  ]);

  const countMap: Record<string, number> = { PENDING: 0, UNDER_REVIEW: 0, APPROVED: 0, REJECTED: 0 };
  for (const c of counts) countMap[c.status] = c._count._all;

  const total = Object.values(countMap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Link href={`/organizer/tournaments/${id}`} className="text-muted-foreground hover:text-foreground">
              Tournaments
            </Link>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span>Registrations</span>
          </> as any
        }
        description={`Review and approve team applications for ${tournament.name}.`}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: total, color: "secondary" },
          { label: "Pending", value: countMap.PENDING, color: "amber" },
          { label: "Under Review", value: countMap.UNDER_REVIEW, color: "blue" },
          { label: "Approved", value: countMap.APPROVED, color: "emerald" },
          { label: "Rejected", value: countMap.REJECTED, color: "rose" },
        ].map((c) => (
          <Card key={c.label} className="p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold tabular-nums">{c.value}</p>
          </Card>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/organizer/tournaments/${id}/registrations?status=ALL`}>
          <StatusBadge label="All" color={filter === "ALL" ? "primary" : "secondary"} />
        </Link>
        {Object.values(REGISTRATION_STATUS).map((s) => (
          <Link key={s} href={`/organizer/tournaments/${id}/registrations?status=${s}`}>
            <StatusBadge label={`${REG_STATUS_META[s]?.label ?? s} (${countMap[s] ?? 0})`} color={filter === s ? "primary" : "secondary"} />
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {registrations.length === 0 ? (
            <EmptyState icon={Trophy} title="No registrations" description="No team applications match the current filter." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead className="hidden md:table-cell">Manager</TableHead>
                    <TableHead className="hidden sm:table-cell">Players</TableHead>
                    <TableHead className="hidden lg:table-cell">Entry Fee</TableHead>
                    <TableHead className="hidden md:table-cell">Payment</TableHead>
                    <TableHead className="hidden xl:table-cell">Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((r) => (
                    <TableRow key={r.id} className={r.status === "PENDING" ? "bg-amber-500/5" : undefined}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.team.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.team.district || r.team.address || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="min-w-0">
                          <p className="truncate text-sm">{r.team.manager?.user?.name ?? "—"}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{r.team.manager?.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">{r.team._count.players}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">{taka(0)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs">
                            {r.paymentMethod ? `${PAYMENT_METHOD_META[r.paymentMethod]?.emoji ?? ""} ${PAYMENT_METHOD_META[r.paymentMethod]?.label ?? r.paymentMethod}` : "—"}
                          </span>
                          <StatusBadge label={PAYMENT_STATUS_META[r.paymentStatus]?.label ?? r.paymentStatus} color={PAYMENT_STATUS_META[r.paymentStatus]?.color ?? "secondary"} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground" title={formatDateTime(r.registeredAt)}>
                        {relativeTime(r.registeredAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={REG_STATUS_META[r.status]?.label ?? r.status} color={REG_STATUS_META[r.status]?.color ?? "secondary"} dot />
                      </TableCell>
                      <TableCell className="text-right">
                        <RegActionsButton
                          tournamentId={id}
                          regId={r.id}
                          teamName={r.team.name}
                          currentStatus={r.status}
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
