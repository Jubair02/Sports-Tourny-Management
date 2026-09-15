import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { ensureOrganizerOfTournament } from "@/lib/api-guard";
import {
  TOURNAMENT_STATUS, TOURNAMENT_STATUS_META,
} from "@/lib/constants";
import { logAudit, notify } from "@/lib/helpers";

// Allowed transitions per current status (organizer-driven).
const ORGANIZER_TRANSITIONS: Record<string, string[]> = {
  DRAFT: [TOURNAMENT_STATUS.PENDING_APPROVAL],
  PENDING_APPROVAL: [TOURNAMENT_STATUS.DRAFT], // withdraw / fix
  PUBLISHED: [TOURNAMENT_STATUS.REGISTRATION_OPEN, TOURNAMENT_STATUS.CANCELLED],
  REGISTRATION_OPEN: [TOURNAMENT_STATUS.REGISTRATION_CLOSED, TOURNAMENT_STATUS.CANCELLED],
  REGISTRATION_CLOSED: [TOURNAMENT_STATUS.ONGOING, TOURNAMENT_STATUS.CANCELLED],
  ONGOING: [TOURNAMENT_STATUS.COMPLETED, TOURNAMENT_STATUS.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { session, error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const { status: target, note } = (await req.json()) as { status?: string; note?: string };
    if (!target) return errorResponse("status is required", 400);

    const tournament = await db.tournament.findUnique({
      where: { id },
      include: { organizer: { include: { user: true } } },
    });
    if (!tournament) return errorResponse("Tournament not found", 404);

    const previous = tournament.status;
    const allowed = session!.role === "ADMIN"
      ? Object.values(TOURNAMENT_STATUS)
      : (ORGANIZER_TRANSITIONS[previous] ?? []);

    if (!allowed.includes(target)) {
      return errorResponse(
        `Transition not allowed: ${previous} → ${target}. Allowed: ${allowed.join(", ") || "none"}`,
        400,
      );
    }

    // Enforce minTeams approved when going ONGOING
    if (target === TOURNAMENT_STATUS.ONGOING) {
      const approvedCount = await db.tournamentParticipant.count({ where: { tournamentId: id } });
      if (approvedCount < tournament.minTeams) {
        return errorResponse(
          `Cannot start tournament: only ${approvedCount} approved team(s) — minimum is ${tournament.minTeams}.`,
          400,
        );
      }
    }

    // DRAFT → PENDING_APPROVAL: organizer must be approved (already enforced by guard for non-admin).
    // PUBLISHED → REGISTRATION_OPEN: dates sanity (regStart <= now <= regDeadline ideally)
    if (target === TOURNAMENT_STATUS.REGISTRATION_OPEN) {
      const now = new Date();
      if (tournament.regDeadline && now > tournament.regDeadline) {
        return errorResponse("Registration deadline has already passed — extend it in settings first.", 400);
      }
    }

    const updated = await db.tournament.update({ where: { id }, data: { status: target } });

    await logAudit({
      userId: session!.id,
      action: "TOURNAMENT_STATUS_CHANGE",
      entity: "Tournament",
      entityId: id,
      detail: `"${tournament.name}" — ${previous} → ${target}${note ? ` · ${note}` : ""}`,
    });

    const meta = TOURNAMENT_STATUS_META[target];
    // Notify organizer
    if (tournament.organizer?.user) {
      await notify({
        userId: tournament.organizer.user.id,
        title: "Tournament status updated",
        message: `"${tournament.name}" is now ${meta?.label ?? target}.${note ? ` Note: ${note}` : ""}`,
        type: "SYSTEM",
        link: "/organizer",
      });
    }
    // Notify all team managers whose teams registered/approved
    const regTeams = await db.tournamentRegistration.findMany({
      where: { tournamentId: id, status: { in: ["APPROVED", "PENDING", "UNDER_REVIEW"] } },
      include: { team: { include: { manager: { include: { user: true } } } } },
    });
    const notified = new Set<string>();
    for (const r of regTeams) {
      const uid = r.team.manager?.user?.id;
      if (uid && !notified.has(uid)) {
        notified.add(uid);
        await notify({
          userId: uid,
          title: "Tournament status update",
          message: `"${tournament.name}" is now ${meta?.label ?? target}.`,
          type: "FIXTURE",
          link: "/team/tournaments",
        });
      }
    }

    return json({
      ok: true,
      tournament: { id: updated.id, status: updated.status },
      message: `Status updated to ${meta?.label ?? target}`,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer status POST", e);
    return errorResponse("Failed to update status", 500);
  }
}
