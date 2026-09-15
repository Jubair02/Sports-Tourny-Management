import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { ensureOrganizerOfTournament } from "@/lib/api-guard";
import { logAudit, notify } from "@/lib/helpers";

// POST — assign refereeId to a match (upsert RefereeAssignment).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  try {
    const { id, matchId } = await params;
    const { session, error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const body = await req.json();
    const { refereeId } = body as { refereeId?: string };
    if (!refereeId) return errorResponse("refereeId is required", 400);

    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true, awayTeam: true,
        tournament: { select: { name: true } },
      },
    });
    if (!match || match.tournamentId !== id) return errorResponse("Match not found", 404);

    const referee = await db.refereeProfile.findUnique({
      where: { id: refereeId },
      include: { user: true },
    });
    if (!referee) return errorResponse("Referee not found", 404);

    const assignment = await db.refereeAssignment.upsert({
      where: { matchId },
      create: { matchId, refereeId },
      update: { refereeId },
    });

    // Sync legacy match.refereeId column too
    await db.match.update({ where: { id: matchId }, data: { refereeId } });

    await logAudit({
      userId: session!.id,
      action: "REFEREE_ASSIGN",
      entity: "Match",
      entityId: matchId,
      detail: `Assigned ${referee.user.name} to ${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"} (${match.tournament.name})`,
    });

    await notify({
      userId: referee.user.id,
      title: "New match assignment",
      message: `You were assigned to ${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"} in ${match.tournament.name}. Check your matches tab.`,
      type: "FIXTURE",
      link: "/referee/matches",
    });

    return json({ assignment }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer assign-referee POST", e);
    return errorResponse("Failed to assign referee", 500);
  }
}
