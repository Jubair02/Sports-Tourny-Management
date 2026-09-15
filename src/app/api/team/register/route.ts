import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json, errorResponse } from "@/lib/auth";
import { logAudit, notify } from "@/lib/helpers";
import { PAYMENT_METHODS } from "@/lib/constants";

async function getManagerContext() {
  const session = await getSession();
  if (!session) return { session: null, prof: null, error: errorResponse("Unauthorized", 401) };
  if (!["TEAM_MANAGER", "ADMIN"].includes(session.role)) return { session, prof: null, error: errorResponse("Forbidden", 403) };
  let prof = await db.teamManagerProfile.findUnique({ where: { userId: session.id } });
  if (!prof && session.role === "ADMIN") {
    prof = await db.teamManagerProfile.findFirst();
  }
  if (!prof) return { session, prof: null, error: errorResponse("No team manager profile found", 403) };
  return { session, prof, error: null };
}

export async function POST(req: NextRequest) {
  try {
    const { session, prof, error } = await getManagerContext();
    if (error) return error;

    const body = await req.json();
    const { tournamentId, teamId, paymentMethod } = body as {
      tournamentId: string;
      teamId: string;
      paymentMethod?: string;
    };

    if (!tournamentId || !teamId) return errorResponse("tournamentId and teamId are required", 400);
    if (paymentMethod && !Object.values(PAYMENT_METHODS).includes(paymentMethod as any)) {
      return errorResponse("Invalid payment method", 400);
    }

    // Validate tournament exists and is open
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: { organizer: { include: { user: true } } },
    });
    if (!tournament) return errorResponse("Tournament not found", 404);
    if (tournament.status !== "REGISTRATION_OPEN") {
      return errorResponse(`Tournament is not open for registration (status: ${tournament.status})`, 400);
    }

    // Validate team ownership
    const team = await db.team.findUnique({ where: { id: teamId }, select: { managerId: true, name: true } });
    if (!team) return errorResponse("Team not found", 404);
    if (team.managerId !== prof!.id && session!.role !== "ADMIN") {
      return errorResponse("Not your team", 403);
    }

    // Already registered?
    const existing = await db.tournamentRegistration.findUnique({
      where: { tournamentId_teamId: { tournamentId, teamId } },
    });
    if (existing) {
      return errorResponse(`Already registered (status: ${existing.status})`, 409);
    }

    // Max teams cap
    const count = await db.tournamentRegistration.count({ where: { tournamentId } });
    if (count >= tournament.maxTeams) {
      return errorResponse("Tournament is full", 400);
    }

    const registration = await db.tournamentRegistration.create({
      data: {
        tournamentId,
        teamId,
        status: "PENDING",
        paymentMethod: paymentMethod ?? null,
        paymentStatus: tournament.entryFee > 0 ? "PENDING" : "PAID",
      },
    });

    await logAudit({
      userId: session!.id,
      action: "TEAM_REGISTER",
      entity: "TournamentRegistration",
      entityId: registration.id,
      detail: `Team "${team.name}" applied to tournament "${tournament.name}"`,
    });

    // Notify organizer
    if (tournament.organizer?.user) {
      await notify({
        userId: tournament.organizer.user.id,
        title: "New tournament application",
        message: `${team.name} applied to ${tournament.name}. Review and approve.`,
        type: "REGISTRATION",
        link: "/organizer/registrations",
      });
    }
    // Notify the manager themselves
    await notify({
      userId: session!.id,
      title: "Application submitted",
      message: `Your application to ${tournament.name} with ${team.name} is now pending organizer approval.`,
      type: "REGISTRATION",
      link: "/team/applications",
    });

    return json({ registration }, 201);
  } catch (e) {
    console.error("register POST error", e);
    return errorResponse("Failed to register team", 500);
  }
}
