import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) {
    const sp = await searchParams;
    const DASHBOARDS: Record<string, string> = {
      ADMIN: "/admin",
      ORGANIZER: "/organizer",
      TEAM_MANAGER: "/team",
      REFEREE: "/referee",
    };
    redirect(sp.next || DASHBOARDS[session.role] || "/");
  }
  return <RegisterForm />;
}
