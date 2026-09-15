import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "./db";
import { ROLES, type Role } from "./constants";

const SESSION_COOKIE = "tourney_session";
const SECRET = process.env.AUTH_SECRET || "tourney-platform-secret-change-me";

function sign(payload: string) {
  const hmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verify(token: string): string | null {
  try {
    const [payload, hmac] = token.split(".");
    if (!payload || !hmac) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (hmac !== expected) return null;
    return payload;
  } catch {
    return null;
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string | null;
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = verify(token);
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, avatar: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    avatar: user.avatar,
  };
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  const token = sign(userId);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await requireAuth();
  if (!roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}

// Password hashing using scrypt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const verifyHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch {
    return false;
  }
}

export function isAuthorized(session: SessionUser | null, ...roles: Role[]): boolean {
  if (!session) return false;
  if (session.role === ROLES.ADMIN) return true; // admin can access everything
  return roles.includes(session.role);
}

// Helper to create API JSON responses
export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

// Guard for API routes — returns session or throws a Response
export async function apiRequireRole(...roles: Role[]): Promise<SessionUser> {
  try {
    return await requireRole(...roles);
  } catch (e) {
    const msg = (e as Error).message;
    throw new Response(JSON.stringify({ error: msg === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" }), {
      status: msg === "UNAUTHORIZED" ? 401 : 403,
    });
  }
}
