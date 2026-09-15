import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrganizerShell } from "@/components/organizer/organizer-shell";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/organizer");
  if (!["ORGANIZER", "ADMIN"].includes(session.role as string)) {
    redirect("/login?next=/organizer&reason=forbidden");
  }
  return <OrganizerShell user={session}>{children}</OrganizerShell>;
}
