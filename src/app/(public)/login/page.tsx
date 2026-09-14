import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

const DASHBOARDS: Record<string, string> = {
  ADMIN: "/admin",
  ORGANIZER: "/organizer",
  TEAM_MANAGER: "/team",
  REFEREE: "/referee",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) {
    const sp = await searchParams;
    redirect(sp.next || DASHBOARDS[session.role] || "/");
  }
  return <LoginForm />;
}
