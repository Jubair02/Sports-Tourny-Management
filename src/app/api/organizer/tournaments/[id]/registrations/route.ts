import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { ensureOrganizerOfTournament } from "@/lib/api-guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const registrations = await db.tournamentRegistration.findMany({
      where: { tournamentId: id },
      include: {
        team: {
          include: {
            manager: { include: { user: true } },
            _count: { select: { players: true } },
          },
        },
      },
      orderBy: { registeredAt: "desc" },
    });

    const counts = {
      total: registrations.length,
      pending: registrations.filter((r) => r.status === "PENDING").length,
      under_review: registrations.filter((r) => r.status === "UNDER_REVIEW").length,
      approved: registrations.filter((r) => r.status === "APPROVED").length,
      rejected: registrations.filter((r) => r.status === "REJECTED").length,
    };

    return json({ registrations, counts });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer registrations GET", e);
    return errorResponse("Failed to fetch registrations", 500);
  }
}
