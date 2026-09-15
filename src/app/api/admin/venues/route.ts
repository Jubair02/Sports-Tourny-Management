import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES, BANGLADESH_DIVISIONS } from "@/lib/constants";
import { logAudit, slugify } from "@/lib/helpers";

const ALL_DISTRICTS = Object.values(BANGLADESH_DIVISIONS).flat();

export async function GET() {
  try {
    await apiRequireRole(ROLES.ADMIN);
    const venues = await db.venue.findMany({
      include: { _count: { select: { matches: true, tournaments: true } } },
      orderBy: { name: "asc" },
    });
    return json({ venues });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to fetch venues", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const body = await req.json();
    const { name, division, district, upazila, address, capacity, facilities, image } = body as {
      name: string;
      division: string;
      district: string;
      upazila?: string;
      address?: string;
      capacity?: number;
      facilities?: string[];
      image?: string;
    };

    if (!name || !division || !district) {
      return errorResponse("Name, division and district are required", 400);
    }
    if (!ALL_DISTRICTS.includes(district)) {
      return errorResponse("Invalid district", 400);
    }

    const venue = await db.venue.create({
      data: {
        name: name.trim(),
        division,
        district,
        upazila: upazila?.trim() || null,
        address: address?.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        facilities: facilities?.length ? JSON.stringify(facilities) : null,
        image: image?.trim() || null,
      },
    });

    await logAudit({
      userId: session.id,
      action: "VENUE_CREATE",
      entity: "Venue",
      entityId: venue.id,
      detail: `Created venue "${venue.name}" (${venue.district}, ${venue.division})`,
    });

    return json({ venue }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to create venue", 500);
  }
}
