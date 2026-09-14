import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json, errorResponse } from "@/lib/auth";
import { logAudit } from "@/lib/helpers";
import { BANGLADESH_DIVISIONS } from "@/lib/constants";

const ALL_DISTRICTS = Object.values(BANGLADESH_DIVISIONS).flat();

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse("Unauthorized", 401);
    if (!["TEAM_MANAGER", "ADMIN"].includes(session.role)) return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { name, phone, district } = body as { name?: string; phone?: string; district?: string };

    if (district && !ALL_DISTRICTS.includes(district)) return errorResponse("Invalid district", 400);

    const prof = await db.teamManagerProfile.findUnique({ where: { userId: session.id } });
    if (!prof) return errorResponse("No team manager profile found", 404);

    const userUpdate: any = {};
    if (name !== undefined) {
      if (!name.trim()) return errorResponse("Name cannot be empty", 400);
      userUpdate.name = name.trim();
    }
    if (Object.keys(userUpdate).length > 0) {
      await db.user.update({ where: { id: session.id }, data: userUpdate });
    }

    const profUpdate: any = {};
    if (phone !== undefined) profUpdate.phone = phone?.trim() || null;
    if (district !== undefined) profUpdate.district = district;
    if (Object.keys(profUpdate).length > 0) {
      await db.teamManagerProfile.update({ where: { id: prof.id }, data: profUpdate });
    }

    await logAudit({
      userId: session.id,
      action: "PROFILE_UPDATE",
      entity: "TeamManagerProfile",
      entityId: prof.id,
      detail: `Updated profile${name ? ` (name: ${name})` : ""}`,
    });

    return json({ ok: true });
  } catch (e) {
    console.error("profile PATCH error", e);
    return errorResponse("Failed to update profile", 500);
  }
}
