import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { logAudit } from "@/lib/helpers";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const { id } = await params;
    const ann = await db.announcement.findUnique({ where: { id } });
    if (!ann) return errorResponse("Announcement not found", 404);

    await db.announcement.delete({ where: { id } });

    await logAudit({
      userId: session.id,
      action: "ANNOUNCEMENT_DELETE",
      entity: "Announcement",
      entityId: id,
      detail: `"${ann.title}"`,
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to delete announcement", 500);
  }
}
