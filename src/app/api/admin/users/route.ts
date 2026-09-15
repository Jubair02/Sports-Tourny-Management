import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await apiRequireRole(ROLES.ADMIN);
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || undefined;
    const q = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        organizerProfile: true,
        teamManagerProfile: true,
        refereeProfile: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return json({ users });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to fetch users", 500);
  }
}
