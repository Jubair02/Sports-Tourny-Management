import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse, requireAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const url = new URL(req.url);
    const only = url.searchParams.get("filter"); // "unread"
    const notifications = await db.notification.findMany({
      where: {
        userId: session.id,
        ...(only === "unread" ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const unread = await db.notification.count({ where: { userId: session.id, read: false } });
    return json({
      notifications: notifications.map((n) => ({ ...n, when: relativeTime(n.createdAt) })),
      unread,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { id, all } = await req.json();
    if (all) {
      await db.notification.updateMany({ where: { userId: session.id, read: false }, data: { read: true } });
    } else if (id) {
      await db.notification.updateMany({ where: { id, userId: session.id }, data: { read: true } });
    }
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed", 500);
  }
}
