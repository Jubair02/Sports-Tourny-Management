import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!["ADMIN"].includes(session.role)) redirect("/login?next=/admin&reason=forbidden");
  return <AdminShell user={session}>{children}</AdminShell>;
}
