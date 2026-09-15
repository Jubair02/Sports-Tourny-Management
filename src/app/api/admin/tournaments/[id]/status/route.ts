import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES, TOURNAMENT_STATUS, TOURNAMENT_STATUS_META } from "@/lib/constants";
import { logAudit, notify } from "@/lib/helpers";

const VALID_STATUSES = new Set(Object.values(TOURNAMENT_STATUS));

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const { id } = await params;
    const { status, note } = (await req.json()) as { status: string; note?: string };

    if (!VALID_STATUSES.has(status)) {
      return errorResponse(`Invalid status. Allowed: ${Object.values(TOURNAMENT_STATUS).join(", ")}`, 400);
    }

    const tournament = await db.tournament.findUnique({
      where: { id },
      include: { organizer: { include: { user: true } } },
    });
    if (!tournament) return errorResponse("Tournament not found", 404);

    const previousStatus = tournament.status;

    // Admin can force any status transition
    const updated = await db.tournament.update({
      where: { id },
      data: { status },
    });

    const statusMeta = TOURNAMENT_STATUS_META[status];

    await notify({
      userId: tournament.organizer.userId,
      title: "Tournament Status Update",
      message: `Your tournament "${tournament.name}" was moved to ${statusMeta?.label ?? status} by the admin.${note ? ` Note: ${note}` : ""}`,
      type: "SYSTEM",
      link: `/organizer`,
    });

    await logAudit({
      userId: session.id,
      action: "TOURNAMENT_STATUS_CHANGE",
      entity: "Tournament",
      entityId: id,
      detail: `"${tournament.name}" — ${previousStatus} → ${status}${note ? ` · ${note}` : ""}`,
    });

    return json({
      ok: true,
      tournament: { id: updated.id, status: updated.status },
      message: `Tournament status updated to ${statusMeta?.label ?? status}`,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to update tournament status", 500);
  }
}
