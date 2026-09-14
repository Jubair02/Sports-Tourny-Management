import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json, errorResponse } from "@/lib/auth";
import { logAudit, notify } from "@/lib/helpers";

// Ensure caller is the assigned referee (or ADMIN)
async function ensureAssignedReferee(matchId: string) {
  const session = await getSession();
  if (!session) return { session: null, prof: null, error: errorResponse("Unauthorized", 401) };
  if (!["REFEREE", "ADMIN"].includes(session.role)) {
    return { session, prof: null, error: errorResponse("Forbidden", 403) };
  }
  if (session.role === "ADMIN") {
    return { session, prof: null, error: null };
  }
  const prof = await db.refereeProfile.findUnique({ where: { userId: session.id } });
  const assignment = await db.refereeAssignment.findUnique({
    where: { matchId },
    select: { refereeId: true },
  });
  if (!prof || !assignment || assignment.refereeId !== prof.id) {
    return { session, prof: null, error: errorResponse("Not your assignment", 403) };
  }
  return { session, prof, error: null };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { session, error } = await ensureAssignedReferee(id);
    if (error) return error;

    const body = await req.json();
    const {
      homeScore, awayScore,
      homeRuns, homeWickets, homeOvers,
      awayRuns, awayWickets, awayOvers,
      winnerTeamId, playerOfMatch, notes, events,
    } = body as {
      homeScore?: number; awayScore?: number;
      homeRuns?: number; homeWickets?: number; homeOvers?: string;
      awayRuns?: number; awayWickets?: number; awayOvers?: string;
      winnerTeamId?: string | null;
      playerOfMatch?: string;
      notes?: string;
      events?: { type: string; teamId: string; playerId: string; minute: number; note?: string }[];
    };

    const match = await db.match.findUnique({
      where: { id },
      include: {
        homeTeam: { include: { manager: { include: { user: true } } } },
        awayTeam: { include: { manager: { include: { user: true } } } },
        tournament: { include: { organizer: { include: { user: true } } } },
      },
    });
    if (!match) return errorResponse("Match not found", 404);

    // Already officially approved? Block re-submission (organizer must reject first)
    if (match.resultStatus === "APPROVED") {
      return errorResponse("Result is already official. Ask the organizer to reject it before re-submitting.", 409);
    }

    // Build update data
    const data: any = {
      status: "COMPLETED",
      resultStatus: "SUBMITTED", // CRITICAL: never APPROVED here
      resultNote: "Submitted by referee",
    };

    if (homeScore != null) data.homeScore = Number(homeScore);
    if (awayScore != null) data.awayScore = Number(awayScore);

    // Cricket fields
    if (homeRuns != null) data.homeRuns = Number(homeRuns);
    if (homeWickets != null) data.homeWickets = Number(homeWickets);
    if (homeOvers !== undefined) data.homeOvers = homeOvers || null;
    if (awayRuns != null) data.awayRuns = Number(awayRuns);
    if (awayWickets != null) data.awayWickets = Number(awayWickets);
    if (awayOvers !== undefined) data.awayOvers = awayOvers || null;

    // winner — if provided, validate it's one of the team ids; else infer
    let resolvedWinner: string | null = null;
    if (winnerTeamId) {
      if (winnerTeamId !== match.homeTeamId && winnerTeamId !== match.awayTeamId) {
        return errorResponse("winnerTeamId must be one of the match's teams", 400);
      }
      resolvedWinner = winnerTeamId;
    } else if (match.homeTeamId && match.awayTeamId) {
      if (homeScore != null && awayScore != null) {
        resolvedWinner = Number(homeScore) > Number(awayScore) ? match.homeTeamId : Number(awayScore) > Number(homeScore) ? match.awayTeamId : null;
      } else if (homeRuns != null && awayRuns != null) {
        resolvedWinner = Number(homeRuns) > Number(awayRuns) ? match.homeTeamId : Number(awayRuns) > Number(homeRuns) ? match.awayTeamId : null;
      }
    }
    if (resolvedWinner) data.winnerTeamId = resolvedWinner;

    if (playerOfMatch !== undefined) data.playerOfMatch = playerOfMatch?.trim() || null;
    if (notes !== undefined) data.notes = notes?.trim() || null;

    const updated = await db.match.update({ where: { id }, data });

    // Persist events (single MatchEvent row per match, JSON encoded)
    if (events && Array.isArray(events)) {
      const clean = events
        .filter((e) => e && e.type && e.teamId && e.playerId)
        .map((e) => ({
          type: e.type,
          teamId: e.teamId,
          playerId: e.playerId,
          minute: Number(e.minute) || 0,
          note: e.note || undefined,
        }));
      await db.matchEvent.upsert({
        where: { matchId: id },
        create: { matchId: id, eventsJson: JSON.stringify(clean) },
        update: { eventsJson: JSON.stringify(clean) },
      });
    } else if (events === undefined) {
      // Keep existing events
    } else {
      // events explicitly set to null/empty
      await db.matchEvent.upsert({
        where: { matchId: id },
        create: { matchId: id, eventsJson: JSON.stringify([]) },
        update: { eventsJson: JSON.stringify([]) },
      });
    }

    // Audit log
    await logAudit({
      userId: session!.id,
      action: "RESULT_SUBMIT",
      entity: "Match",
      entityId: id,
      detail: `Referee submitted result for ${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"} (${match.tournament.name})`,
    });

    // Notify organizer
    if (match.tournament.organizer?.user) {
      await notify({
        userId: match.tournament.organizer.user.id,
        title: "Match result submitted",
        message: `${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"} — submitted by referee. Review and approve.`,
        type: "RESULT",
        link: "/organizer/results",
      });
    }
    // Notify both team managers
    const teamManagers = [match.homeTeam?.manager?.user, match.awayTeam?.manager?.user].filter(Boolean);
    for (const u of teamManagers) {
      if (u) {
        await notify({
          userId: u.id,
          title: "Match result submitted",
          message: `Your match (${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"}) result was submitted by the referee and is pending organizer approval.`,
          type: "RESULT",
          link: "/team/results",
        });
      }
    }

    return json({ match: updated });
  } catch (e) {
    console.error("submit POST error", e);
    return errorResponse("Failed to submit result", 500);
  }
}
