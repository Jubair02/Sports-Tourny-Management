import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile } from "@/lib/queries";
import { PageHeader, EmptyState, SectionHeading } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ClipboardList, ShieldAlert, Clock, CheckCircle2, XCircle } from "lucide-react";
import { LinkDisputeDialog } from "@/components/team/raise-dispute-dialog";
import { formatDate, formatDateTime } from "@/lib/helpers";
import { REG_STATUS_META, PAYMENT_METHOD_META, PAYMENT_STATUS_META, DISPUTE_TYPES } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const session = await getSession();
  let profile = session ? await getTeamManagerProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.teamManagerProfile.findFirst({ include: { user: true } });
  }

  const registrations = profile
    ? await db.tournamentRegistration.findMany({
        where: { team: { managerId: profile.id } },
        include: { tournament: { include: { venue: true } }, team: true },
        orderBy: { registeredAt: "desc" },
      })
    : [];

  // group by status
  const grouped = {
    PENDING: registrations.filter((r) => r.status === "PENDING"),
    UNDER_REVIEW: registrations.filter((r) => r.status === "UNDER_REVIEW"),
    APPROVED: registrations.filter((r) => r.status === "APPROVED"),
    REJECTED: registrations.filter((r) => r.status === "REJECTED"),
  };

  const cards = [
    { label: "Pending", value: grouped.PENDING.length, icon: Clock, accent: "amber" as const },
    { label: "Under Review", value: grouped.UNDER_REVIEW.length, icon: ClipboardList, accent: "blue" as const },
    { label: "Approved", value: grouped.APPROVED.length, icon: CheckCircle2, accent: "primary" as const },
    { label: "Rejected", value: grouped.REJECTED.length, icon: XCircle, accent: "rose" as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Track the status of your tournament registrations."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}><CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{c.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <SectionHeading title="All Applications" description={`${registrations.length} total application(s).`} />

      {registrations.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications yet"
          description="Apply to an open tournament to see your status here."
          action={<Link href="/team/tournaments" className="text-sm text-primary hover:underline">Browse tournaments</Link>}
        />
      ) : (
        <div className="space-y-3">
          {registrations.map((r) => {
            const meta = REG_STATUS_META[r.status] ?? { label: r.status, color: "secondary" };
            const payMeta = PAYMENT_STATUS_META[r.paymentStatus] ?? { label: r.paymentStatus, color: "secondary" };
            return (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/tournaments/${r.tournamentId}`} className="font-semibold hover:underline">
                          {r.tournament.name}
                        </Link>
                        <StatusBadge label={meta.label} color={meta.color} dot />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Team: {r.team.name} · Applied {formatDateTime(r.registeredAt)}
                      </p>
                      {r.tournament.venue && (
                        <p className="text-xs text-muted-foreground">Venue: {r.tournament.venue.name}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 text-xs">
                      <span className="text-muted-foreground">Payment</span>
                      <StatusBadge label={payMeta.label} color={payMeta.color} dot />
                      {r.paymentMethod && (
                        <span className="text-muted-foreground">
                          via {PAYMENT_METHOD_META[r.paymentMethod]?.label ?? r.paymentMethod}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.reviewNote && (
                    <div className="rounded-md bg-muted/40 p-2 text-xs">
                      <span className="font-medium">Organizer note: </span>
                      <span className="text-muted-foreground">{r.reviewNote}</span>
                    </div>
                  )}
                  {r.rejectionReason && r.status === "REJECTED" && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs">
                      <span className="font-medium text-destructive">Rejection reason: </span>
                      <span>{r.rejectionReason}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <LinkDisputeDialog
                      type={DISPUTE_TYPES.OTHER}
                      presetTitle={`Issue with application for ${r.tournament.name}`}
                      presetTournamentId={r.tournamentId}
                      trigger={
                        <button className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-accent">
                          <ShieldAlert className="h-3 w-3" /> Report Issue
                        </button>
                      }
                    />
                    <Link
                      href={`/team/teams/${r.teamId}`}
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-accent"
                    >
                      View team
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
