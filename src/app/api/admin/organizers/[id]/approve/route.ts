import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES, ORGANIZER_APPROVAL } from "@/lib/constants";
import { logAudit, notify } from "@/lib/helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const { id } = await params;
    const { action, reason } = (await req.json()) as { action: "approve" | "reject"; reason?: string };

    if (!["approve", "reject"].includes(action)) {
      return errorResponse("Invalid action", 400);
    }

    const profile = await db.organizerProfile.findUnique({
      where: { id },
      include: { user: true, tournaments: { select: { id: true, name: true } } },
    });
    if (!profile) return errorResponse("Organizer profile not found", 404);

    const newStatus = action === "approve" ? ORGANIZER_APPROVAL.APPROVED : ORGANIZER_APPROVAL.REJECTED;

    const updated = await db.organizerProfile.update({
      where: { id },
      data: {
        approvalStatus: newStatus,
        rejectionReason: action === "reject" ? (reason || "Application rejected by admin") : null,
      },
    });

    await notify({
      userId: profile.userId,
      title: action === "approve" ? "Organizer Application Approved 🎉" : "Organizer Application Rejected",
      message:
        action === "approve"
          ? `Congratulations ${profile.user.name}! Your organizer account is approved. You can now create and publish tournaments.`
          : `Your organizer application was rejected. Reason: ${reason || "Not specified"}. Please contact support for clarification.`,
      type: "SYSTEM",
      link: action === "approve" ? "/organizer" : undefined,
    });

    await logAudit({
      userId: session.id,
      action: action === "approve" ? "ORGANIZER_APPROVE" : "ORGANIZER_REJECT",
      entity: "OrganizerProfile",
      entityId: id,
      detail: `${profile.user.name} (${profile.user.email}) — ${newStatus}${reason ? ` · ${reason}` : ""}. Linked tournaments: ${profile.tournaments.length}`,
    });

    return json({
      ok: true,
      approvalStatus: updated.approvalStatus,
      message: `Organizer ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to update organizer approval", 500);
  }
}
