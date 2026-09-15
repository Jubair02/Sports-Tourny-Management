import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, hashPassword, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { logAudit, notify } from "@/lib/helpers";

export async function GET(req: NextRequest) {
  try {
    await apiRequireRole(ROLES.ADMIN);
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || undefined;
    const q = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        organizerProfile: true,
        teamManagerProfile: true,
        refereeProfile: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return json({ users });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to fetch users", 500);
  }
}

// POST /api/admin/users — admin creates an account directly
export async function POST(req: NextRequest) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const body = await req.json();
    const { name, email, password, phone, role, district, organization, specialization } =
      body as Record<string, string | undefined>;

    if (!name?.trim()) return errorResponse("Name is required", 400);
    if (!email?.trim()) return errorResponse("Email is required", 400);
    if (!password || password.length < 6) {
      return errorResponse("Password must be at least 6 characters", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return errorResponse("Enter a valid email address", 400);
    }
    if (!role || !Object.values(ROLES).includes(role as never)) {
      return errorResponse("Invalid role", 400);
    }

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return errorResponse("Email already registered", 409);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        phone: phone?.trim() || null,
        role,
        status: "ACTIVE",
      },
    });

    // Mirror the role-specific profile that public registration would create.
    if (role === ROLES.TEAM_MANAGER) {
      await db.teamManagerProfile.create({
        data: { userId: user.id, phone: phone?.trim() || null, district: district || null },
      });
    } else if (role === ROLES.REFEREE) {
      await db.refereeProfile.create({
        data: {
          userId: user.id,
          phone: phone?.trim() || null,
          district: district || null,
          specialization: specialization || null,
        },
      });
    } else if (role === ROLES.ORGANIZER) {
      // Created by an admin, so it is approved up front — no pending queue step.
      await db.organizerProfile.create({
        data: {
          userId: user.id,
          phone: phone?.trim() || null,
          district: district || null,
          organization: organization || null,
          approvalStatus: "APPROVED",
        },
      });
    }

    await notify({
      userId: user.id,
      title: "Account Created",
      message: `An administrator created your TourneyBD account. Sign in with ${normalizedEmail}.`,
      type: "SYSTEM",
    });

    await logAudit({
      userId: session.id,
      action: "USER_CREATE",
      entity: "User",
      entityId: user.id,
      detail: `Created ${normalizedEmail} as ${role}`,
    });

    return json(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } },
      201,
    );
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return errorResponse("Failed to create user", 500);
  }
}
