import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { ensureOrganizerOfTournament } from "@/lib/api-guard";
import { recalcStandings, advanceKnockout } from "@/lib/standings";
import { logAudit, notify } from "@/lib/helpers";

// POST — approve or reject a SUBMITTED referee result.
// Body: { action: "APPROVE" | "REJECT", note?: string }
// On APPROVE: resultStatus → APPROVED, keep winnerTeamId (already set by referee),
// then await recalcStandings(tournamentId).
// On REJECT: resultStatus → REJECTED, set resultNote to reason; allow referee to re-submit.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  try {
    const { id, matchId } = await params;
    const { session, error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const body = await req.json();
    const { action, note } = body as { action?: string; note?: string };
    if (action !== "APPROVE" && action !== "REJECT") {
      return errorResponse("action must be APPROVE or REJECT", 400);
    }

    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { include: { manager: { include: { user: true } } } },
        awayTeam: { include: { manager: { include: { user: true } } } },
        tournament: { include: { organizer: { include: { user: true } } } },
        assignment: { include: { referee: { include: { user: true } } } },
      },
    });
    if (!match || match.tournamentId !== id) return errorResponse("Match not found", 404);

    if (match.resultStatus !== "SUBMITTED") {
      return errorResponse(
        `Cannot ${action.toLowerCase()} a result with status ${match.resultStatus}. Only SUBMITTED results can be reviewed.`,
        409,
      );
    }

    if (action === "APPROVE") {
      const updated = await db.match.update({
        where: { id: matchId },
        data: {
          resultStatus: "APPROVED",
          resultNote: note?.trim() || "Approved by organizer",
        },
      });

      // Recalculate standings from APPROVED + COMPLETED matches
      await recalcStandings(id);

      // For knockout brackets, promote the winner into the next round once the
      // current round is fully decided (no-op for round-robin / group formats).
      await advanceKnockout(id);

      await logAudit({
        userId: session!.id,
        action: "RESULT_APPROVE",
        entity: "Match",
        entityId: matchId,
        detail: `${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"} (${match.tournament.name}) approved${note ? ` · ${note}` : ""}`,
      });

      // Notify referee + both team managers
      if (match.assignment?.referee?.user) {
        await notify({
          userId: match.assignment.referee.user.id,
          title: "Result approved",
          message: `Your submitted result for ${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"} is now official. Standings updated.`,
          type: "RESULT",
          link: "/referee/history",
        });
      }
      const managers = [match.homeTeam?.manager?.user, match.awayTeam?.manager?.user].filter(Boolean);
      for (const u of managers) {
        if (u) {
          await notify({
            userId: u.id,
            title: "Match result official",
            message: `Result for ${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"} is now official. Standings have been updated.`,
            type: "RESULT",
            link: "/team/standings",
          });
        }
      }

      return json({ match: updated, standings: "recalculated" });
    }

    // REJECT
    const updated = await db.match.update({
      where: { id: matchId },
      data: {
        resultStatus: "REJECTED",
        resultNote: note?.trim() || "Rejected by organizer — please re-submit",
      },
    });

    await logAudit({
      userId: session!.id,
      action: "RESULT_REJECT",
      entity: "Match",
      entityId: matchId,
      detail: `${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"} rejected${note ? ` · ${note}` : ""}`,
    });

    if (match.assignment?.referee?.user) {
      await notify({
        userId: match.assignment.referee.user.id,
        title: "Result rejected",
        message: `Your result for ${match.homeTeam?.name ?? "?"} vs ${match.awayTeam?.name ?? "?"} was rejected by the organizer.${note ? ` Reason: ${note}` : ""} Please review and re-submit.`,
        type: "RESULT",
        link: `/referee/matches/${matchId}`,
      });
    }

    return json({ match: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer result POST", e);
    return errorResponse("Failed to process result action", 500);
  }
}
