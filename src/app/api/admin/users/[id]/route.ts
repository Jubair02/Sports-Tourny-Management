import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, hashPassword, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { logAudit, notify } from "@/lib/helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const { id } = await params;
    const body = await req.json();
    const { status, role, name, email, phone, password } = body as {
      status?: string;
      role?: string;
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return errorResponse("User not found", 404);
    if (user.role === ROLES.ADMIN && session.id !== user.id) {
      // Don't allow suspending other admins (only self)
      return errorResponse("Cannot modify other admin accounts", 403);
    }

    const data: any = {};
    if (status && ["ACTIVE", "SUSPENDED"].includes(status)) data.status = status;
    if (role && Object.values(ROLES).includes(role as any)) data.role = role;

    if (name !== undefined) {
      if (!name.trim()) return errorResponse("Name cannot be empty", 400);
      data.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return errorResponse("Enter a valid email address", 400);
      }
      if (normalizedEmail !== user.email) {
        const taken = await db.user.findUnique({ where: { email: normalizedEmail } });
        if (taken) return errorResponse("Email already registered", 409);
        data.email = normalizedEmail;
      }
    }

    if (phone !== undefined) data.phone = phone.trim() || null;

    if (password) {
      if (password.length < 6) return errorResponse("Password must be at least 6 characters", 400);
      data.passwordHash = hashPassword(password);
    }

    if (Object.keys(data).length === 0) {
      return errorResponse("Nothing to update", 400);
    }

    const updated = await db.user.update({ where: { id }, data });

    // A role change needs the matching profile row, or role-specific pages break.
    if (data.role && data.role !== user.role) {
      if (data.role === ROLES.TEAM_MANAGER) {
        await db.teamManagerProfile.upsert({
          where: { userId: id },
          create: { userId: id, phone: updated.phone },
          update: {},
        });
      } else if (data.role === ROLES.REFEREE) {
        await db.refereeProfile.upsert({
          where: { userId: id },
          create: { userId: id, phone: updated.phone },
          update: {},
        });
      } else if (data.role === ROLES.ORGANIZER) {
        await db.organizerProfile.upsert({
          where: { userId: id },
          create: { userId: id, phone: updated.phone, approvalStatus: "APPROVED" },
          update: {},
        });
      }
    }

    if (status === "SUSPENDED") {
      await notify({
        userId: id,
        title: "Account Suspended",
        message: "Your TourneyBD account has been suspended. Please contact support.",
        type: "SYSTEM",
      });
    } else if (status === "ACTIVE") {
      await notify({
        userId: id,
        title: "Account Reactivated",
        message: "Your TourneyBD account has been reactivated. Welcome back!",
        type: "SYSTEM",
      });
    }

    await logAudit({
      userId: session.id,
      action: "USER_UPDATE",
      entity: "User",
      entityId: id,
      detail: `Updated ${user.email}: ${Object.entries(data)
        // Never write the hash into the audit trail — just record that it changed.
        .map(([k, v]) => (k === "passwordHash" ? "password=reset" : `${k}=${v}`))
        .join(", ")}`,
    });

    return json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        status: updated.status,
        role: updated.role,
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to update user", 500);
  }
}
