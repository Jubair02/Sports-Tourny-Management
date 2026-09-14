import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeamShell } from "@/components/team/team-shell";

export const dynamic = "force-dynamic";

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/team");
  if (!["TEAM_MANAGER", "ADMIN"].includes(session.role)) {
    redirect("/login?next=/team&reason=forbidden");
  }
  return (
    <TeamShell user={session}>
      {children}
    </TeamShell>
  );
}
