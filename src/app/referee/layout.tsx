import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RefereeShell } from "@/components/referee/referee-shell";

export const dynamic = "force-dynamic";

export default async function RefereeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/referee");
  if (!["REFEREE", "ADMIN"].includes(session.role)) {
    redirect("/login?next=/referee&reason=forbidden");
  }
  return (
    <RefereeShell user={session}>
      {children}
    </RefereeShell>
  );
}
