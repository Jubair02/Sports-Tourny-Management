import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";
import { ProfileForm } from "@/components/team/profile-form";

export const dynamic = "force-dynamic";

export default async function TeamProfilePage() {
  const session = await getSession();
  let profile = session ? await getTeamManagerProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.teamManagerProfile.findFirst({ include: { user: true } });
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" />
        <EmptyState
          icon={UserCircle}
          title="No profile found"
          description="Your account is not linked to a team manager profile."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Update your contact information." />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="h-4 w-4 text-primary" /> Account & Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
