import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { ensureOrganizerOfTournament } from "@/lib/api-guard";
import { logAudit, notify } from "@/lib/helpers";

// POST — create announcement scoped to this tournament.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { session, error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const body = await req.json();
    const { title, content, pinned } = body as { title?: string; content?: string; pinned?: boolean };
    if (!title?.trim() || !content?.trim()) return errorResponse("Title and content are required", 400);

    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: session!.id,
        tournamentId: id,
        pinned: Boolean(pinned),
      },
    });

    await logAudit({
      userId: session!.id,
      action: "ANNOUNCEMENT_CREATE",
      entity: "Announcement",
      entityId: announcement.id,
      detail: `"${announcement.title}" (tournament ${id})${pinned ? " · pinned" : ""}`,
    });

    // Notify all approved team managers
    const approved = await db.tournamentRegistration.findMany({
      where: { tournamentId: id, status: "APPROVED" },
      include: { team: { include: { manager: { include: { user: true } } } } },
    });
    const seen = new Set<string>();
    for (const r of approved) {
      const uid = r.team.manager?.user?.id;
      if (uid && !seen.has(uid)) {
        seen.add(uid);
        await notify({
          userId: uid,
          title: `Update: ${announcement.title}`,
          message: content!.slice(0, 140) + (content!.length > 140 ? "…" : ""),
          type: "SYSTEM",
          link: "/team/tournaments",
        });
      }
    }

    return json({ announcement }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer announcement POST", e);
    return errorResponse("Failed to create announcement", 500);
  }
}
