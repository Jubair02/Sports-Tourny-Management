import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json, errorResponse } from "@/lib/auth";
import { logAudit, notify } from "@/lib/helpers";

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

export async function GET(req: NextRequest) {
  const { prof, error } = await getManagerContext();
  if (error) return error;

  const teamIds = await db.team.findMany({
    where: { managerId: prof!.id },
    select: { id: true },
  });
  const ids = teamIds.map((t) => t.id);

  const players = await db.player.findMany({
    where: { teamId: { in: ids } },
    include: { team: { select: { id: true, name: true } } },
    orderBy: [{ teamId: "asc" }, { jerseyNumber: "asc" }, { name: "asc" }],
  });
  return json({ players });
}

export async function POST(req: NextRequest) {
  try {
    const { session, prof, error } = await getManagerContext();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    if (!teamId) return errorResponse("teamId query param is required", 400);

    // Ownership check
    const team = await db.team.findUnique({ where: { id: teamId }, select: { managerId: true, name: true } });
    if (!team) return errorResponse("Team not found", 404);
    if (team.managerId !== prof!.id && session!.role !== "ADMIN") {
      return errorResponse("Not your team", 403);
    }

    const body = await req.json();
    const { name, photo, dateOfBirth, phone, jerseyNumber, position, nidReference } = body as {
      name: string;
      photo?: string;
      dateOfBirth?: string;
      phone?: string;
      jerseyNumber?: number;
      position?: string;
      nidReference?: string;
    };

    if (!name || !name.trim()) return errorResponse("Player name is required", 400);
    if (jerseyNumber != null) {
      const dup = await db.player.findFirst({
        where: { teamId, jerseyNumber: Number(jerseyNumber) },
      });
      if (dup) return errorResponse(`Jersey #${jerseyNumber} already taken on this team`, 409);
    }

    const player = await db.player.create({
      data: {
        teamId,
        name: name.trim(),
        photo: photo?.trim() || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phone: phone?.trim() || null,
        jerseyNumber: jerseyNumber != null ? Number(jerseyNumber) : null,
        position: position || null,
        nidReference: nidReference?.trim() || null,
        verificationStatus: "PENDING",
      },
    });

    await logAudit({
      userId: session!.id,
      action: "PLAYER_ADD",
      entity: "Player",
      entityId: player.id,
      detail: `Added player "${player.name}" to team "${team.name}"`,
    });

    // Notify organizer(s) of the team's tournaments — to verify the player
    const regs = await db.tournamentRegistration.findMany({
      where: { teamId, status: { in: ["PENDING", "UNDER_REVIEW", "APPROVED"] } },
      include: { tournament: { include: { organizer: { include: { user: true } } } } },
    });
    const organizerUserIds = new Set<string>();
    for (const r of regs) {
      if (r.tournament.organizer?.user) organizerUserIds.add(r.tournament.organizer.user.id);
    }
    for (const oid of organizerUserIds) {
      await notify({
        userId: oid,
        title: "New player added",
        message: `${player.name} added to ${team.name} — pending verification.`,
        type: "REGISTRATION",
        link: `/organizer/teams`,
      });
    }

    return json({ player }, 201);
  } catch (e) {
    console.error("player POST error", e);
    return errorResponse("Failed to add player", 500);
  }
}
