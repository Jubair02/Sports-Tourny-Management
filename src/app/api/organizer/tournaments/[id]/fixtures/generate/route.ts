import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { ensureOrganizerOfTournament } from "@/lib/api-guard";
import {
  generateSingleElimination, generateRoundRobin, generateGroupKnockout,
} from "@/lib/standings";
import { TOURNAMENT_FORMATS, TOURNAMENT_STATUS } from "@/lib/constants";
import { logAudit, notify } from "@/lib/helpers";

// POST — generate fixtures for a tournament.
// Reads approved registrations (creates TournamentParticipant rows first if missing),
// then calls the appropriate generator from lib/standings based on tournament.format.
// Sets tournament status to REGISTRATION_CLOSED (or ONGOING if minTeams ≥ approved).
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { session, error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const tournament = await db.tournament.findUnique({ where: { id } });
    if (!tournament) return errorResponse("Tournament not found", 404);

    if (tournament.status !== "REGISTRATION_CLOSED" && tournament.status !== "REGISTRATION_OPEN") {
      return errorResponse(
        `Fixtures can only be generated when registration is closed or open (current: ${tournament.status}).`,
        400,
      );
    }

    // Block re-generation if matches already exist
    const existingMatches = await db.match.count({ where: { tournamentId: id } });
    if (existingMatches > 0) {
      return errorResponse(
        `Tournament already has ${existingMatches} match(es). Delete them before regenerating.`,
        409,
      );
    }

    const approvedRegs = await db.tournamentRegistration.findMany({
      where: { tournamentId: id, status: "APPROVED" },
      include: { team: true },
      orderBy: { registeredAt: "asc" },
    });
    if (approvedRegs.length < 2) {
      return errorResponse("Need at least 2 approved teams to generate fixtures.", 400);
    }
    if (approvedRegs.length < tournament.minTeams) {
      return errorResponse(
        `Only ${approvedRegs.length} approved team(s) — minimum is ${tournament.minTeams}.`,
        400,
      );
    }

    // Ensure participants exist for each approved team
    for (const r of approvedRegs) {
      await db.tournamentParticipant.upsert({
        where: { tournamentId_teamId: { tournamentId: id, teamId: r.teamId } },
        create: { tournamentId: id, teamId: r.teamId },
        update: {},
      });
    }
    const teamIds = approvedRegs.map((r) => r.teamId);

    let result;
    const venueId = tournament.venueId ?? undefined;
    switch (tournament.format) {
      case TOURNAMENT_FORMATS.ROUND_ROBIN:
        result = await generateRoundRobin(id, teamIds, venueId);
        break;
      case TOURNAMENT_FORMATS.GROUP_KNOCKOUT:
        result = await generateGroupKnockout(id, teamIds, venueId);
        break;
      case TOURNAMENT_FORMATS.SINGLE_ELIMINATION:
      default:
        result = await generateSingleElimination(id, teamIds, venueId);
        break;
    }

    // Move status to ONGOING if minimum teams satisfied; otherwise REGISTRATION_CLOSED
    const newStatus = tournament.status === "REGISTRATION_OPEN"
      ? TOURNAMENT_STATUS.REGISTRATION_CLOSED
      : tournament.status;
    await db.tournament.update({ where: { id }, data: { status: newStatus } });

    await logAudit({
      userId: session!.id,
      action: "FIXTURES_GENERATE",
      entity: "Tournament",
      entityId: id,
      detail: `Generated ${result.matches} fixture(s) for "${tournament.name}" (${tournament.format}, ${teamIds.length} teams)`,
    });

    // Notify all approved team managers
    const managers = new Set<string>();
    for (const r of approvedRegs) {
      const m = r.team.manager?.user?.id;
      if (m && !managers.has(m)) {
        managers.add(m);
        await notify({
          userId: m,
          title: "Fixtures generated",
          message: `Match fixtures for "${tournament.name}" have been published. Check your upcoming matches.`,
          type: "FIXTURE",
          link: "/team/fixtures",
        });
      }
    }

    return json({
      ok: true,
      matches: result.matches,
      round: result.round,
      teams: teamIds.length,
      status: newStatus,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer fixtures generate POST", e);
    return errorResponse("Failed to generate fixtures", 500);
  }
}
