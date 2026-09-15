import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json, errorResponse } from "@/lib/auth";
import { logAudit } from "@/lib/helpers";

async function ensurePlayerOwner(playerId: string) {
  const session = await getSession();
  if (!session) return { session: null, error: errorResponse("Unauthorized", 401) };
  if (!["TEAM_MANAGER", "ADMIN"].includes(session.role)) return { session, error: errorResponse("Forbidden", 403) };
  if (session.role === "ADMIN") {
    const player = await db.player.findUnique({ where: { id: playerId }, select: { id: true, teamId: true } });
    if (!player) return { session, error: errorResponse("Player not found", 404) };
    return { session, player, error: null };
  }
  const prof = await db.teamManagerProfile.findUnique({ where: { userId: session.id } });
  const player = await db.player.findUnique({
    where: { id: playerId },
    include: { team: { select: { managerId: true, name: true } } },
  });
  if (!prof || !player || player.team.managerId !== prof.id) {
    return { session, player: null, error: errorResponse("Not your player", 403) };
  }
  return { session, player, error: null };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { session, player, error } = await ensurePlayerOwner(id);
    if (error) return error;

    const body = await req.json();
    const { name, photo, dateOfBirth, phone, jerseyNumber, position, nidReference, verificationNote } = body as Record<string, any>;

    const data: any = {};
    if (name !== undefined) data.name = String(name).trim();
    if (photo !== undefined) data.photo = photo ? String(photo).trim() : null;
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (jerseyNumber !== undefined) data.jerseyNumber = jerseyNumber == null ? null : Number(jerseyNumber);
    if (position !== undefined) data.position = position || null;
    if (nidReference !== undefined) data.nidReference = nidReference ? String(nidReference).trim() : null;
    // verificationNote is informational only — we don't change verificationStatus here (organizer/admin does)

    if (data.jerseyNumber != null) {
      const dup = await db.player.findFirst({
        where: { teamId: player!.teamId, jerseyNumber: data.jerseyNumber, NOT: { id } },
      });
      if (dup) return errorResponse(`Jersey #${data.jerseyNumber} already taken`, 409);
    }

    const updated = await db.player.update({ where: { id }, data });

    await logAudit({
      userId: session!.id,
      action: "PLAYER_UPDATE",
      entity: "Player",
      entityId: id,
      detail: `Updated player "${updated.name}"${verificationNote ? ` — note: ${verificationNote}` : ""}`,
    });

    return json({ player: updated });
  } catch (e) {
    console.error("player PATCH error", e);
    return errorResponse("Failed to update player", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { session, player, error } = await ensurePlayerOwner(id);
    if (error) return error;

    await db.player.delete({ where: { id } });

    await logAudit({
      userId: session!.id,
      action: "PLAYER_REMOVE",
      entity: "Player",
      entityId: id,
      detail: `Removed player "${player!.name}"`,
    });

    return json({ ok: true });
  } catch (e) {
    console.error("player DELETE error", e);
    return errorResponse("Failed to remove player", 500);
  }
}
