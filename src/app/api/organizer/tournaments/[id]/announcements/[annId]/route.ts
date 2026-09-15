import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { ensureOrganizerOfTournament } from "@/lib/api-guard";
import { logAudit } from "@/lib/helpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; annId: string }> },
) {
  try {
    const { id, annId } = await params;
    const { session, error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const ann = await db.announcement.findUnique({ where: { id: annId } });
    if (!ann || ann.tournamentId !== id) return errorResponse("Announcement not found", 404);

    await db.announcement.delete({ where: { id: annId } });

    await logAudit({
      userId: session!.id,
      action: "ANNOUNCEMENT_DELETE",
      entity: "Announcement",
      entityId: annId,
      detail: `"${ann.title}"`,
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer announcement DELETE", e);
    return errorResponse("Failed to delete announcement", 500);
  }
}
