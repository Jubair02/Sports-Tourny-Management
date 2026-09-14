import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { setSession, verifyPassword, json, errorResponse } from "@/lib/auth";
import { logAudit } from "@/lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return errorResponse("Email and password required", 400);
    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return errorResponse("Invalid email or password", 401);
    }
    if (user.status !== "ACTIVE") return errorResponse("Account suspended", 403);
    await setSession(user.id);
    await logAudit({ userId: user.id, action: "LOGIN", detail: `${user.name} logged in` });
    return json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (e) {
    return errorResponse("Login failed", 500);
  }
}

export async function GET() {
  // reuse getSession via me route logic
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return json({ user: null });
  return json({ user: session });
}
