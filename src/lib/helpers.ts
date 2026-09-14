import { db } from "./db";

export async function logAudit(opts: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        detail: opts.detail,
      },
    });
  } catch (e) {
    console.error("Failed to write audit log", e);
  }
}

export async function notify(opts: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  try {
    await db.notification.create({
      data: {
        userId: opts.userId,
        title: opts.title,
        message: opts.message,
        type: opts.type ?? "SYSTEM",
        link: opts.link,
      },
    });
  } catch (e) {
    console.error("Failed to create notification", e);
  }
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function matchCode(tournamentId: string, index: number): string {
  return `M${String(index + 1).padStart(3, "0")}`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "TBD";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "TBD";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function taka(n: number | null | undefined): string {
  if (n == null) return "—";
  return `৳${n.toLocaleString("en-BD")}`;
}

export function relativeTime(d: Date | string): string {
  const diff = Date.now() - new Date(d).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(d);
}
