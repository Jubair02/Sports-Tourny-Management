import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await apiRequireRole(ROLES.ADMIN);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const where: any = {};
    if (status) where.status = status;

    // NOTE: Dispute model in schema.prisma stores `tournamentId` and `matchId`
    // as plain String? columns — there is no `tournament`/`match` relation on
    // Dispute. Fetch disputes first, then resolve related tournaments/matches
    // manually via separate findMany calls (same pattern as admin/disputes/page.tsx).
    const disputes = await db.dispute.findMany({
      where,
      include: {
        raisedBy: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const tournamentIds = Array.from(
      new Set(disputes.map((d) => d.tournamentId).filter(Boolean) as string[]),
    );
    const matchIds = Array.from(
      new Set(disputes.map((d) => d.matchId).filter(Boolean) as string[]),
    );

    const [tournaments, matches] = await Promise.all([
      tournamentIds.length
        ? db.tournament.findMany({
            where: { id: { in: tournamentIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([] as { id: string; name: string }[]),
      matchIds.length
        ? db.match.findMany({
            where: { id: { in: matchIds } },
            select: {
              id: true,
              matchCode: true,
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          })
        : Promise.resolve(
            [] as {
              id: string;
              matchCode: string | null;
              homeTeam: { name: string } | null;
              awayTeam: { name: string } | null;
            }[],
          ),
    ]);

    const tournamentMap = new Map(tournaments.map((t) => [t.id, t]));
    const matchMap = new Map(matches.map((m) => [m.id, m]));

    const enriched = disputes.map((d) => {
      const tournament = d.tournamentId ? tournamentMap.get(d.tournamentId) ?? null : null;
      const match = d.matchId ? matchMap.get(d.matchId) ?? null : null;
      return {
        id: d.id,
        type: d.type,
        title: d.title,
        description: d.description,
        status: d.status,
        resolution: d.resolution,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        raisedBy: d.raisedBy,
        tournament: tournament ? { id: tournament.id, name: tournament.name } : null,
        match: match
          ? {
              id: match.id,
              matchCode: match.matchCode,
              homeTeam: match.homeTeam ? { name: match.homeTeam.name } : null,
              awayTeam: match.awayTeam ? { name: match.awayTeam.name } : null,
            }
          : null,
      };
    });

    return json({ disputes: enriched });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to fetch disputes", 500);
  }
}
