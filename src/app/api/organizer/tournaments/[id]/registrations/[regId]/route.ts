import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { ensureOrganizerOfTournament } from "@/lib/api-guard";
import { REGISTRATION_STATUS } from "@/lib/constants";
import { logAudit, notify } from "@/lib/helpers";

const VALID = new Set<string>(Object.values(REGISTRATION_STATUS));

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> },
) {
  try {
    const { id, regId } = await params;
    const { session, error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const body = (await req.json()) as { status?: string; reason?: string; note?: string };
    const target = body.status;
    if (!target || !VALID.has(target)) {
      return errorResponse(`Invalid status. Allowed: ${Object.values(REGISTRATION_STATUS).join(", ")}`, 400);
    }

    const reg = await db.tournamentRegistration.findUnique({
      where: { id: regId },
      include: {
        team: { include: { manager: { include: { user: true } } } },
        tournament: { include: { organizer: { include: { user: true } } } },
      },
    });
    if (!reg || reg.tournamentId !== id) return errorResponse("Registration not found", 404);

    const previous = reg.status;

    const data: Record<string, unknown> = { status: target };
    if (target === REGISTRATION_STATUS.REJECTED) data.rejectionReason = body.reason?.trim() || null;
    else data.rejectionReason = null;
    if (target === REGISTRATION_STATUS.UNDER_REVIEW) data.reviewNote = body.note?.trim() || null;

    const updated = await db.tournamentRegistration.update({ where: { id: regId }, data });

    // If APPROVED, ensure TournamentParticipant exists
    if (target === REGISTRATION_STATUS.APPROVED) {
      await db.tournamentParticipant.upsert({
        where: { tournamentId_teamId: { tournamentId: id, teamId: reg.teamId } },
        create: { tournamentId: id, teamId: reg.teamId },
        update: {},
      });
    } else if (target === REGISTRATION_STATUS.REJECTED) {
      // Remove from participants if previously approved
      await db.tournamentParticipant.deleteMany({ where: { tournamentId: id, teamId: reg.teamId } });
    }

    await logAudit({
      userId: session!.id,
      action: "REGISTRATION_REVIEW",
      entity: "TournamentRegistration",
      entityId: regId,
      detail: `${reg.team.name} for ${reg.tournament.name} — ${previous} → ${target}${body.reason ? ` · reason: ${body.reason}` : ""}${body.note ? ` · note: ${body.note}` : ""}`,
    });

    // Notify team manager
    if (reg.team.manager?.user) {
      const messages: Record<string, { title: string; message: string }> = {
        APPROVED: {
          title: "Registration approved",
          message: `Your team "${reg.team.name}" has been approved to play in "${reg.tournament.name}".`,
        },
        REJECTED: {
          title: "Registration rejected",
          message: `Your team "${reg.team.name}" was rejected for "${reg.tournament.name}".${body.reason ? ` Reason: ${body.reason}` : ""}`,
        },
        UNDER_REVIEW: {
          title: "Registration under review",
          message: `Your registration for "${reg.tournament.name}" is under review.${body.note ? ` Note: ${body.note}` : ""}`,
        },
        PENDING: {
          title: "Registration reset to pending",
          message: `Your registration for "${reg.tournament.name}" was moved back to pending.`,
        },
      };
      const m = messages[target];
      if (m) {
        await notify({
          userId: reg.team.manager.user.id,
          title: m.title,
          message: m.message,
          type: "REGISTRATION",
          link: "/team/applications",
        });
      }
    }

    return json({ registration: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer registration PATCH", e);
    return errorResponse("Failed to update registration", 500);
  }
}
