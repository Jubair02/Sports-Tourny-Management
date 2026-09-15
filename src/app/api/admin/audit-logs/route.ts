import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await apiRequireRole(ROLES.ADMIN);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "20", 10)));

    const where: any = {};
    if (q) {
      where.OR = [
        { action: { contains: q } },
        { detail: { contains: q } },
        { entity: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.auditLog.count({ where }),
    ]);

    return json({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to fetch audit logs", 500);
  }
}
