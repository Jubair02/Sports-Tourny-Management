import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await apiRequireRole(ROLES.ADMIN);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const sport = searchParams.get("sport") || undefined;
    const q = searchParams.get("q") || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (sport) where.sport = sport;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const tournaments = await db.tournament.findMany({
      where,
      include: {
        venue: true,
        organizer: { include: { user: true } },
        _count: { select: { registrations: true, matches: true, participants: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return json({ tournaments });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to fetch tournaments", 500);
  }
}
