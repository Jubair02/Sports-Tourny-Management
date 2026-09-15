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
import { RegActionsButton } from "@/components/organizer/reg-actions-button";
import {
  REG_STATUS_META, PAYMENT_METHOD_META, PAYMENT_STATUS_META,
} from "@/lib/constants";
import { formatDateTime, relativeTime } from "@/lib/helpers";
import { ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganizerRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;
  const filter = sp.status || "PENDING";

  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });

  const tournamentIds = prof
    ? (await db.tournament.findMany({ where: { organizerId: prof.id }, select: { id: true } })).map((t) => t.id)
    : [];

  if (tournamentIds.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Registrations" description="All team applications across your tournaments." />
        <EmptyState icon={ClipboardCheck} title="No tournaments yet" description="Create a tournament first to receive registrations." />
      </div>
    );
  }

  const where: any = { tournamentId: { in: tournamentIds } };
  if (filter !== "ALL") where.status = filter;

  const registrations = await db.tournamentRegistration.findMany({
    where,
    include: {
      team: { include: { manager: { include: { user: true } }, _count: { select: { players: true } } } },
      tournament: { select: { id: true, name: true, sport: true } },
    },
    orderBy: { registeredAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrations"
        description="All team applications across your tournaments."
      />

      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((s) => (
          <Link key={s} href={`/organizer/registrations?status=${s}`}>
            <StatusBadge label={s === "ALL" ? "All" : REG_STATUS_META[s]?.label ?? s} color={filter === s ? "primary" : "secondary"} />
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {registrations.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No registrations" description="No team applications match the current filter." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead className="hidden md:table-cell">Tournament</TableHead>
                    <TableHead className="hidden lg:table-cell">Manager</TableHead>
                    <TableHead className="hidden xl:table-cell">Payment</TableHead>
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
                          <p className="truncate text-xs text-muted-foreground">{r.team._count.players} players</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <SportBadge sport={r.tournament.sport} />
                          <Link href={`/organizer/tournaments/${r.tournamentId}`} className="truncate text-xs hover:text-primary">
                            {r.tournament.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="min-w-0">
                          <p className="truncate text-sm">{r.team.manager?.user?.name ?? "—"}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{r.team.manager?.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
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
                          tournamentId={r.tournamentId}
                          regId={r.id}
                          teamName={r.team.name}
                          currentStatus={r.status}
                          compact
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
