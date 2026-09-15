import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json, errorResponse } from "@/lib/auth";
import { logAudit } from "@/lib/helpers";
import { BANGLADESH_DIVISIONS } from "@/lib/constants";

const ALL_DISTRICTS = Object.values(BANGLADESH_DIVISIONS).flat();

async function ensureTeamOwner(teamId: string) {
  const session = await getSession();
  if (!session) return { session: null, error: errorResponse("Unauthorized", 401) };
  if (!["TEAM_MANAGER", "ADMIN"].includes(session.role)) return { session, error: errorResponse("Forbidden", 403) };
  if (session.role === "ADMIN") {
    const team = await db.team.findUnique({ where: { id: teamId }, select: { managerId: true } });
    if (!team) return { session, error: errorResponse("Team not found", 404) };
    return { session, error: null };
  }
  const prof = await db.teamManagerProfile.findUnique({ where: { userId: session.id } });
  const team = await db.team.findUnique({ where: { id: teamId }, select: { managerId: true, name: true } });
  if (!prof || !team || team.managerId !== prof.id) {
    return { session, error: errorResponse("Not your team", 403) };
  }
  return { session, error: null };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await ensureTeamOwner(id);
  if (error) return error;
  const team = await db.team.findUnique({
    where: { id },
    include: {
      players: { orderBy: [{ jerseyNumber: "asc" }, { name: "asc" }] },
      registrations: { include: { tournament: true } },
    },
  });
  if (!team) return errorResponse("Team not found", 404);
  return json({ team });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { session, error } = await ensureTeamOwner(id);
    if (error) return error;

    const body = await req.json();
    const { name, logo, captain, phone, email, district, address, description } = body as Record<string, string | undefined>;
    if (district && !ALL_DISTRICTS.includes(district)) return errorResponse("Invalid district", 400);

    const data: any = {};
    if (name !== undefined) {
      if (!name.trim()) return errorResponse("Team name cannot be empty", 400);
      data.name = name.trim();
    }
    if (logo !== undefined) data.logo = logo?.trim() || null;
    if (captain !== undefined) data.captain = captain?.trim() || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (email !== undefined) data.email = email?.trim() || null;
    if (district !== undefined) data.district = district;
    if (address !== undefined) data.address = address?.trim() || null;
    if (description !== undefined) data.description = description?.trim() || null;

    const team = await db.team.update({ where: { id }, data });

    await logAudit({
      userId: session!.id,
      action: "TEAM_UPDATE",
      entity: "Team",
      entityId: team.id,
      detail: `Updated team "${team.name}"`,
    });

    return json({ team });
  } catch (e) {
    console.error("team PATCH error", e);
    return errorResponse("Failed to update team", 500);
  }
}
