import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { logAudit } from "@/lib/helpers";

export async function GET() {
  try {
    await apiRequireRole(ROLES.ADMIN);
    const announcements = await db.announcement.findMany({
      include: {
        author: { select: { id: true, name: true, email: true } },
        tournament: { select: { id: true, name: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 100,
    });
    return json({ announcements });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to fetch announcements", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const { title, content, tournamentId, pinned } = (await req.json()) as {
      title: string;
      content: string;
      tournamentId?: string;
      pinned?: boolean;
    };

    if (!title?.trim() || !content?.trim()) {
      return errorResponse("Title and content are required", 400);
    }

    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: session.id,
        tournamentId: tournamentId || null,
        pinned: Boolean(pinned),
      },
      include: { tournament: true },
    });

    await logAudit({
      userId: session.id,
      action: "ANNOUNCEMENT_CREATE",
      entity: "Announcement",
      entityId: announcement.id,
      detail: `"${announcement.title}"${tournamentId ? ` (tournament-scoped)` : ""}${pinned ? " · pinned" : ""}`,
    });

    return json({ announcement }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to create announcement", 500);
  }
}
