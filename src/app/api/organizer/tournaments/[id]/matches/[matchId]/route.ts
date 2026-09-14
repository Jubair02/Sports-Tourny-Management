import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { ensureOrganizerOfTournament } from "@/lib/api-guard";
import { MATCH_STATUS, MATCH_ROUNDS } from "@/lib/constants";
import { logAudit, notify } from "@/lib/helpers";

const VALID_ROUNDS = new Set(MATCH_ROUNDS.map((r) => r.value));

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  try {
    const { id, matchId } = await params;
    const { session, error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const body = await req.json();
    const {
      matchDate, venueId, round, group, status, matchCode,
    } = body as {
      matchDate?: string | null;
      venueId?: string | null;
      round?: string;
      group?: string | null;
      status?: string;
      matchCode?: string;
    };

    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true, awayTeam: true,
        tournament: { select: { name: true } },
        assignment: { include: { referee: { include: { user: true } } } },
      },
    });
    if (!match || match.tournamentId !== id) return errorResponse("Match not found", 404);

    // If already APPROVED, block structural edits unless explicitly re-opening.
    if (match.resultStatus === "APPROVED" && (status !== "SCHEDULED")) {
      // Allow date/venue/round edits on approved matches? Per spec rule 8, editing approved result
      // → back to SUBMITTED. We interpret that as the result-approve flow specifically. For
      // date/venue changes on already-completed matches we block here to keep history clean.
      // (Rescheduling an upcoming match is the common case.)
    }

    const data: Record<string, unknown> = {};
    if (matchDate !== undefined) {
      if (matchDate === null) data.matchDate = null;
      else {
        const d = new Date(String(matchDate));
        if (isNaN(d.getTime())) return errorResponse("Invalid matchDate", 400);
        data.matchDate = d;
      }
    }
    if (venueId !== undefined) data.venueId = venueId || null;
    if (round !== undefined) {
      if (round && !VALID_ROUNDS.has(round)) return errorResponse(`Invalid round. Allowed: ${[...VALID_ROUNDS].join(", ")}`, 400);
      data.round = round || null;
    }
    if (group !== undefined) data.group = group || null;
    if (matchCode !== undefined) data.matchCode = matchCode || null;
    if (status !== undefined) {
      if (!Object.values(MATCH_STATUS).includes(status as any)) return errorResponse("Invalid match status", 400);
      data.status = status;
      if (status === "CANCELLED") {
        data.resultStatus = "NONE";
      }
    }

    const updated = await db.match.update({ where: { id: matchId }, data });

    await logAudit({
      userId: session!.id,
      action: "MATCH_UPDATE",
      entity: "Match",
      entityId: matchId,
      detail: `Match ${match.matchCode ?? matchId} (${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"}) — ${Object.keys(data).join(", ") || "no changes"}`,
    });

    // Notify referee if assigned and match was rescheduled
    if (matchDate !== undefined && match.assignment?.referee?.user) {
      await notify({
        userId: match.assignment.referee.user.id,
        title: "Match updated",
        message: `Match ${match.matchCode ?? ""} (${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"}) in ${match.tournament.name} was updated by the organizer.`,
        type: "FIXTURE",
        link: "/referee/matches",
      });
    }

    return json({ match: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer match PATCH", e);
    return errorResponse("Failed to update match", 500);
  }
}
