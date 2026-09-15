import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";

const DASHBOARDS: Record<string, string> = {
  ADMIN: "/admin",
  ORGANIZER: "/organizer",
  TEAM_MANAGER: "/team",
  REFEREE: "/referee",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) {
    const sp = await searchParams;
    redirect(sp.next || DASHBOARDS[session.role] || "/");
  }
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
