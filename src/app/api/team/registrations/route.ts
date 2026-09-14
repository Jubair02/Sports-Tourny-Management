import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json, errorResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse("Unauthorized", 401);
    if (!["TEAM_MANAGER", "ADMIN"].includes(session.role)) return errorResponse("Forbidden", 403);

    let managerId: string | undefined;
    if (session.role === "ADMIN") {
      const prof = await db.teamManagerProfile.findFirst();
      managerId = prof?.id;
      // Admin can also filter by managerId if explicitly provided
      const { searchParams } = new URL(req.url);
      const q = searchParams.get("managerId");
      if (q) managerId = q;
    } else {
      const prof = await db.teamManagerProfile.findUnique({ where: { userId: session.id } });
      managerId = prof?.id;
    }

    if (!managerId) return json({ registrations: [] });

    const registrations = await db.tournamentRegistration.findMany({
      where: { team: { managerId } },
      include: {
        tournament: { include: { venue: true, organizer: { include: { user: true } } } },
        team: { select: { id: true, name: true, logo: true } },
      },
      orderBy: { registeredAt: "desc" },
    });

    return json({ registrations });
  } catch (e) {
    console.error("registrations GET error", e);
    return errorResponse("Failed to fetch registrations", 500);
  }
}
