import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json, errorResponse } from "@/lib/auth";
import { logAudit } from "@/lib/helpers";
import { DISPUTE_TYPES } from "@/lib/constants";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return errorResponse("Unauthorized", 401);
    if (!["TEAM_MANAGER", "ADMIN"].includes(session.role)) return errorResponse("Forbidden", 403);

    const where = session.role === "ADMIN" ? {} : { raisedById: session.id };
    // Dispute has no relation to Tournament/Match in schema — fetch raw, then resolve.
    const disputesRaw = await db.dispute.findMany({
      where,
      include: { raisedBy: true },
      orderBy: { createdAt: "desc" },
    });
    const tournamentIds = Array.from(new Set(disputesRaw.map((d) => d.tournamentId).filter(Boolean) as string[]));
    const matchIds = Array.from(new Set(disputesRaw.map((d) => d.matchId).filter(Boolean) as string[]));
    const [tournaments, matches] = await Promise.all([
      tournamentIds.length
        ? db.tournament.findMany({ where: { id: { in: tournamentIds } }, select: { id: true, name: true } })
        : Promise.resolve([]),
      matchIds.length
        ? db.match.findMany({
            where: { id: { in: matchIds } },
            select: { id: true, matchCode: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
          })
        : Promise.resolve([]),
    ]);
    const tournamentMap = new Map(tournaments.map((t) => [t.id, t]));
    const matchMap = new Map(matches.map((m) => [m.id, m]));
    const disputes = disputesRaw.map((d) => ({
      ...d,
      tournament: d.tournamentId ? tournamentMap.get(d.tournamentId) ?? null : null,
      match: d.matchId ? matchMap.get(d.matchId) ?? null : null,
    }));
    return json({ disputes });
  } catch (e) {
    console.error("disputes GET error", e);
    return errorResponse("Failed to fetch disputes", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse("Unauthorized", 401);
    if (!["TEAM_MANAGER", "ADMIN"].includes(session.role)) return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { type, title, description, tournamentId, matchId } = body as {
      type: string;
      title: string;
      description: string;
      tournamentId?: string;
      matchId?: string;
    };

    if (!type || !Object.values(DISPUTE_TYPES).includes(type as any)) {
      return errorResponse("Invalid dispute type", 400);
    }
    if (!title?.trim() || !description?.trim()) {
      return errorResponse("Title and description are required", 400);
    }

    // If tournament/match provided, validate them (and for team manager, that the tournament is one of their team's tournaments)
    if (tournamentId) {
      const t = await db.tournament.findUnique({ where: { id: tournamentId }, select: { id: true, name: true } });
      if (!t) return errorResponse("Tournament not found", 404);
    }
    if (matchId) {
      const m = await db.match.findUnique({
        where: { id: matchId },
        select: { id: true, tournamentId: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
      });
      if (!m) return errorResponse("Match not found", 404);
    }

    const dispute = await db.dispute.create({
      data: {
        type,
        title: title.trim(),
        description: description.trim(),
        tournamentId: tournamentId || null,
        matchId: matchId || null,
        raisedById: session.id,
        status: "OPEN",
      },
    });

    await logAudit({
      userId: session.id,
      action: "DISPUTE_RAISE",
      entity: "Dispute",
      entityId: dispute.id,
      detail: `Raised "${dispute.title}" (${type})`,
    });

    // Notify admins (all admin users)
    const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
    for (const a of admins) {
      await db.notification.create({
        data: {
          userId: a.id,
          title: "New dispute raised",
          message: `"${dispute.title}" — type: ${type}. Review in admin disputes panel.`,
          type: "SYSTEM",
          link: "/admin/disputes",
        },
      });
    }

    return json({ dispute }, 201);
  } catch (e) {
    console.error("disputes POST error", e);
    return errorResponse("Failed to raise dispute", 500);
  }
}
