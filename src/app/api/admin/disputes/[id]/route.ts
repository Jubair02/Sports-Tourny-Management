import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { logAudit, notify } from "@/lib/helpers";

const VALID = new Set(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const { id } = await params;
    const { status, resolution } = (await req.json()) as { status: string; resolution?: string };

    if (!VALID.has(status)) {
      return errorResponse("Invalid status", 400);
    }

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: { raisedBy: true },
    });
    if (!dispute) return errorResponse("Dispute not found", 404);

    const updated = await db.dispute.update({
      where: { id },
      data: {
        status,
        resolution: resolution?.trim() || (status === "RESOLVED" ? dispute.resolution : null),
      },
    });

    await notify({
      userId: dispute.raisedById,
      title: "Dispute Update",
      message: `Your dispute "${dispute.title}" was marked ${status}.${resolution ? ` Note: ${resolution}` : ""}`,
      type: "SYSTEM",
      link: dispute.tournamentId ? `/admin/disputes` : undefined,
    });

    await logAudit({
      userId: session.id,
      action: "DISPUTE_UPDATE",
      entity: "Dispute",
      entityId: id,
      detail: `"${dispute.title}" → ${status}${resolution ? ` · ${resolution}` : ""}`,
    });

    return json({ dispute: { id: updated.id, status: updated.status } });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to update dispute", 500);
  }
}
