import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json, errorResponse } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return errorResponse("Unauthorized", 401);
    if (!["REFEREE", "ADMIN"].includes(session.role)) return errorResponse("Forbidden", 403);

    let prof = await db.refereeProfile.findUnique({ where: { userId: session.id } });
    if (!prof && session.role === "ADMIN") {
      prof = await db.refereeProfile.findFirst();
    }
    if (!prof) return errorResponse("No referee profile found", 404);

    const assignments = await db.refereeAssignment.findMany({
      where: { refereeId: prof.id },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true, tournament: true, venue: true },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    return json({ assignments, refereeId: prof.id });
  } catch (e) {
    console.error("assignments GET error", e);
    return errorResponse("Failed to fetch assignments", 500);
  }
}
