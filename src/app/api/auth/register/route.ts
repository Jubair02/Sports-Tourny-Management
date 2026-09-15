import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { setSession, hashPassword, json, errorResponse, getSession } from "@/lib/auth";
import { logAudit, slugify, notify } from "@/lib/helpers";
import { ROLES } from "@/lib/constants";

// GET /api/auth/me — current session
export async function GET() {
  const session = await getSession();
  if (!session) return json({ user: null });
  return json({ user: session });
}

// POST /api/auth/register — public registration as Team Manager (others created by Admin)
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, district, role } = await req.json();
    if (!name || !email || !password) return errorResponse("Name, email and password are required", 400);
    if (password.length < 6) return errorResponse("Password must be at least 6 characters", 400);
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return errorResponse("Email already registered", 409);

    // Referees are created by admins only — not via public self-registration.
    const allowedRoles = [ROLES.TEAM_MANAGER, ROLES.ORGANIZER];
    const finalRole = allowedRoles.includes(role) ? role : ROLES.TEAM_MANAGER;

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        phone,
        role: finalRole,
      },
    });

    if (finalRole === ROLES.TEAM_MANAGER) {
      await db.teamManagerProfile.create({ data: { userId: user.id, phone, district } });
    } else if (finalRole === ROLES.REFEREE) {
      await db.refereeProfile.create({ data: { userId: user.id, phone, district } });
    } else if (finalRole === ROLES.ORGANIZER) {
      await db.organizerProfile.create({
        data: { userId: user.id, phone, district, approvalStatus: "PENDING" },
      });
      // notify admins
      const admins = await db.user.findMany({ where: { role: "ADMIN" } });
      for (const a of admins) {
        await notify({ userId: a.id, title: "New Organizer Application", message: `${name} applied for organizer approval.`, type: "SYSTEM", link: "/admin/users" });
      }
    }

    await setSession(user.id);
    await logAudit({ userId: user.id, action: "REGISTER", detail: `Registered as ${finalRole}` });
    return json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 201);
  } catch (e) {
    console.error(e);
    return errorResponse("Registration failed", 500);
  }
}
