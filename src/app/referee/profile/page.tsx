import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getRefereeProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Phone, MapPin, Star, Flag, CalendarDays, Award, UserCircle } from "lucide-react";
import { formatDate } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function RefereeProfilePage() {
  const session = await getSession();
  let profile = session ? await getRefereeProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.refereeProfile.findFirst({ include: { user: true } });
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" />
        <EmptyState
          icon={UserCircle}
          title="No referee profile"
          description="Contact an admin to set up your referee profile."
        />
      </div>
    );
  }

  const assignmentsCount = await db.refereeAssignment.count({ where: { refereeId: profile.id } });
  const completedCount = await db.refereeAssignment.count({
    where: {
      refereeId: profile.id,
      match: { status: "COMPLETED" },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Your referee profile and assignment stats." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle className="h-4 w-4 text-primary" /> Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {profile.user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{profile.user?.name}</p>
                <p className="text-xs text-muted-foreground">{profile.user?.email}</p>
                <StatusBadge label={profile.user?.role ?? "REFEREE"} color="secondary" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="text-sm flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {profile.phone ?? "Not set"}
                </p>
              </div>
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">District</p>
                <p className="text-sm flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {profile.district ?? "Not set"}
                </p>
              </div>
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Specialization</p>
                <p className="text-sm flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                  {profile.specialization ?? "General"}
                </p>
              </div>
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Rating</p>
                <p className="text-sm flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {profile.rating > 0 ? profile.rating.toFixed(1) : "Not rated yet"}
                </p>
              </div>
              <div className="rounded-md border p-3 space-y-1 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Member since</p>
                <p className="text-sm flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>
            <div className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
              Profile fields like specialization, rating, and district are managed by the platform admin. Contact them to update.
            </div>
          </CardContent>
        </Card>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <Card><CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Assignments</p>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{assignmentsCount}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{completedCount}</p>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
