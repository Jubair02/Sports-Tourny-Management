import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { setSession, verifyPassword, json, errorResponse } from "@/lib/auth";
import { logAudit } from "@/lib/helpers";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";

// Brute-force guard: at most 5 failed attempts per IP+email per 15 minutes.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return errorResponse("Email and password required", 400);

    const normalizedEmail = email.toLowerCase().trim();
    const key = `login:${clientIp(req)}:${normalizedEmail}`;
    const limit = rateLimit(key, MAX_ATTEMPTS, WINDOW_MS);
    if (!limit.allowed) {
      return Response.json(
        { error: `Too many login attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).` },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return errorResponse("Invalid email or password", 401);
    }
    if (user.status !== "ACTIVE") return errorResponse("Account suspended", 403);

    // Successful auth — clear the counter so a legit user isn't penalized.
    resetRateLimit(key);
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
