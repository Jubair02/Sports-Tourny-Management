import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/helpers";
import { ORGANIZER_APPROVAL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function OrganizerSettingsPage() {
  const session = await getSession();
  if (!session) return null;

  // Read profile + summarize
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({
        where: { approvalStatus: "APPROVED" },
        include: { user: true },
      })
    : await db.organizerProfile.findUnique({
        where: { userId: session.id },
        include: { user: true },
      });

  if (!prof) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage your organizer profile." />
        <EmptyState icon={ShieldAlert} title="No organizer profile" description="Your account is not linked to an organizer profile." />
      </div>
    );
  }

  const tournamentCount = await db.tournament.count({ where: { organizerId: prof.id } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organizer profile, approval status &amp; support."
      />

      {/* Approval status banner */}
      <Card className={prof.approvalStatus === ORGANIZER_APPROVAL.APPROVED ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {prof.approvalStatus === ORGANIZER_APPROVAL.APPROVED ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : prof.approvalStatus === ORGANIZER_APPROVAL.REJECTED ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-semibold">
                Approval Status: <span className={
                  prof.approvalStatus === ORGANIZER_APPROVAL.APPROVED ? "text-emerald-700 dark:text-emerald-400"
                  : prof.approvalStatus === ORGANIZER_APPROVAL.REJECTED ? "text-red-700 dark:text-red-400"
                  : "text-amber-700 dark:text-amber-400"
                }>{prof.approvalStatus}</span>
              </p>
              {prof.approvalStatus === ORGANIZER_APPROVAL.PENDING && (
                <p className="text-sm text-muted-foreground">
                  Your organizer application is awaiting admin review. You'll be notified once approved. You can't create tournaments until approved.
                </p>
              )}
              {prof.approvalStatus === ORGANIZER_APPROVAL.APPROVED && (
                <p className="text-sm text-muted-foreground">
                  You are an approved organizer. You can create and publish tournaments.
                </p>
              )}
              {prof.approvalStatus === ORGANIZER_APPROVAL.REJECTED && (
                <p className="text-sm text-muted-foreground">
                  Your application was rejected.{prof.rejectionReason ? ` Reason: ${prof.rejectionReason}` : ""}
                </p>
              )}
            </div>
          </div>
          {prof.approvalStatus === ORGANIZER_APPROVAL.PENDING && (
            <Button asChild variant="outline" size="sm">
              <Link href="/contact">Contact support</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Profile info */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Member Since" value={formatDate(prof.createdAt)} icon={Clock} accent="secondary" />
        <StatCard label="Tournaments" value={tournamentCount} icon={ShieldAlert} accent="primary" />
        <StatCard label="Status" value={prof.approvalStatus} accent={prof.approvalStatus === ORGANIZER_APPROVAL.APPROVED ? "primary" : "amber"} />
        <StatCard label="District" value={prof.district ?? "—"} accent="secondary" />
      </div>

      {/* Profile details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organizer Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" value={prof.user.name} />
            <Field label="Email" value={prof.user.email} />
            <Field label="Organization" value={prof.organization ?? "—"} />
            <Field label="Phone" value={prof.user.phone ?? "—"} />
            <Field label="District" value={prof.district ?? "—"} />
            <Field label="Member Since" value={formatDate(prof.createdAt)} />
          </div>
          {prof.bio && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bio</p>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{prof.bio}</p>
            </div>
          )}
          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p>To update your organizer profile (organization, district, bio), please contact platform support. Profile updates for organizers are reviewed by admins.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
