import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { logAudit, notify } from "@/lib/helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const { id } = await params;
    const body = await req.json();
    const { status, role } = body as { status?: string; role?: string };

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return errorResponse("User not found", 404);
    if (user.role === ROLES.ADMIN && session.id !== user.id) {
      // Don't allow suspending other admins (only self)
      return errorResponse("Cannot modify other admin accounts", 403);
    }

    const data: any = {};
    if (status && ["ACTIVE", "SUSPENDED"].includes(status)) data.status = status;
    if (role && Object.values(ROLES).includes(role as any)) data.role = role;

    if (Object.keys(data).length === 0) {
      return errorResponse("Nothing to update", 400);
    }

    const updated = await db.user.update({ where: { id }, data });

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
      detail: `Updated ${user.email}: ${Object.entries(data).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    });

    return json({ user: { id: updated.id, name: updated.name, status: updated.status, role: updated.role } });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to update user", 500);
  }
}
