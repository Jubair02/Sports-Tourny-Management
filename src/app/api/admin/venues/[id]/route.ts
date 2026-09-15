import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES, BANGLADESH_DIVISIONS } from "@/lib/constants";
import { logAudit } from "@/lib/helpers";

const ALL_DISTRICTS = Object.values(BANGLADESH_DIVISIONS).flat();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const { id } = await params;
    const body = await req.json();
    const { name, division, district, upazila, address, capacity, facilities, image } = body as {
      name?: string;
      division?: string;
      district?: string;
      upazila?: string;
      address?: string;
      capacity?: number;
      facilities?: string[];
      image?: string;
    };

    const venue = await db.venue.findUnique({ where: { id } });
    if (!venue) return errorResponse("Venue not found", 404);

    if (district && !ALL_DISTRICTS.includes(district)) {
      return errorResponse("Invalid district", 400);
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (division !== undefined) data.division = division;
    if (district !== undefined) data.district = district;
    if (upazila !== undefined) data.upazila = upazila?.trim() || null;
    if (address !== undefined) data.address = address?.trim() || null;
    if (capacity !== undefined) data.capacity = capacity ? Number(capacity) : null;
    if (facilities !== undefined) data.facilities = facilities?.length ? JSON.stringify(facilities) : null;
    if (image !== undefined) data.image = image?.trim() || null;

    if (Object.keys(data).length === 0) return errorResponse("Nothing to update", 400);

    const updated = await db.venue.update({ where: { id }, data });

    await logAudit({
      userId: session.id,
      action: "VENUE_UPDATE",
      entity: "Venue",
      entityId: id,
      detail: `Updated venue "${updated.name}"`,
    });

    return json({ venue: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to update venue", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const { id } = await params;
    const venue = await db.venue.findUnique({ where: { id } });
    if (!venue) return errorResponse("Venue not found", 404);

    await db.venue.delete({ where: { id } });

    await logAudit({
      userId: session.id,
      action: "VENUE_DELETE",
      entity: "Venue",
      entityId: id,
      detail: `Deleted venue "${venue.name}"`,
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Cannot delete venue (it may be referenced by tournaments or matches)", 500);
  }
}
