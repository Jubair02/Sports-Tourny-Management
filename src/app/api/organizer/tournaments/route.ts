import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { getOrganizerContext } from "@/lib/api-guard";
import {
  SPORTS, TOURNAMENT_FORMATS, TOURNAMENT_CATEGORIES, BANGLADESH_DIVISIONS,
} from "@/lib/constants";
import { slugify, logAudit, notify } from "@/lib/helpers";
import { getSettings } from "@/lib/settings";

export async function GET() {
  try {
    const { session, prof, error } = await getOrganizerContext();
    if (error) return error;

    // ADMIN sees all tournaments; ORGANIZER only their own
    const where = session!.role === "ADMIN" ? {} : prof ? { organizerId: prof.id } : {};
    const tournaments = await db.tournament.findMany({
      where,
      include: {
        venue: true,
        organizer: { include: { user: true } },
        _count: { select: { registrations: true, matches: true, participants: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return json({ tournaments });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer tournaments GET", e);
    return errorResponse("Failed to fetch tournaments", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, prof, error } = await getOrganizerContext();
    if (error) return error;

    const body = await req.json();
    const {
      name, sport, description, division, district, upazila, location, venueId,
      startDate, endDate, regStart, regDeadline, entryFee, maxTeams, minTeams,
      format, ageCategory, gender, rules, prizeMoney, category, organizerId,
    } = body as {
      name?: string; sport?: string; description?: string;
      division?: string; district?: string; upazila?: string; location?: string; venueId?: string;
      startDate?: string; endDate?: string; regStart?: string; regDeadline?: string;
      entryFee?: number; maxTeams?: number; minTeams?: number;
      format?: string; ageCategory?: string; gender?: string;
      rules?: string; prizeMoney?: string; category?: string; organizerId?: string;
    };

    // Resolve the owning organizer. An organizer owns their own tournaments; an
    // admin creates on behalf of an organizer they pick (organizerId required).
    let ownerOrganizerId: string;
    if (prof) {
      ownerOrganizerId = prof.id;
    } else {
      // ADMIN path (getOrganizerContext returns prof=null for admins).
      if (!organizerId) {
        return errorResponse("Select an organizer to own this tournament", 400);
      }
      const owner = await db.organizerProfile.findUnique({
        where: { id: organizerId },
        select: { id: true, approvalStatus: true },
      });
      if (!owner) return errorResponse("Organizer not found", 404);
      if (owner.approvalStatus !== "APPROVED") {
        return errorResponse("Chosen organizer is not approved", 400);
      }
      ownerOrganizerId = owner.id;
    }

    if (!name?.trim() || !sport || !description?.trim()) {
      return errorResponse("Name, sport and description are required", 400);
    }
    if (!Object.values(SPORTS).includes(sport as any)) {
      return errorResponse("Invalid sport", 400);
    }
    if (!startDate || !endDate || !regStart || !regDeadline) {
      return errorResponse("Start date, end date, registration start and deadline are required", 400);
    }
    const sd = new Date(startDate); const ed = new Date(endDate);
    const rsd = new Date(regStart); const rdd = new Date(regDeadline);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime()) || isNaN(rsd.getTime()) || isNaN(rdd.getTime())) {
      return errorResponse("Invalid date format", 400);
    }
    if (sd > ed) return errorResponse("Start date must be before end date", 400);
    if (rsd > rdd) return errorResponse("Registration start must be before deadline", 400);
    if (format && !Object.values(TOURNAMENT_FORMATS).includes(format as any)) {
      return errorResponse("Invalid format", 400);
    }
    if (category && !Object.values(TOURNAMENT_CATEGORIES).includes(category as any)) {
      return errorResponse("Invalid category", 400);
    }
    if (division && !BANGLADESH_DIVISIONS[division]) {
      return errorResponse("Invalid division", 400);
    }
    if (district && division && !BANGLADESH_DIVISIONS[division].includes(district)) {
      return errorResponse("District does not match division", 400);
    }

    // Unique slug
    let slug = slugify(name!.trim());
    let suffix = 1;
    while (await db.tournament.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${slugify(name!.trim())}-${suffix++}`;
    }

    // Apply platform-wide scoring defaults set by the admin.
    const platform = await getSettings();

    const tournament = await db.tournament.create({
      data: {
        winPoints: platform.winPoints,
        drawPoints: platform.drawPoints,
        lossPoints: platform.lossPoints,
        name: name!.trim(),
        slug,
        sport,
        description: description!.trim(),
        organizerId: ownerOrganizerId,
        venueId: venueId || null,
        division: division || null,
        district: district || null,
        upazila: upazila || null,
        location: location || null,
        startDate: sd,
        endDate: ed,
        regStart: rsd,
        regDeadline: rdd,
        entryFee: entryFee ? Number(entryFee) : 0,
        maxTeams: maxTeams ? Number(maxTeams) : 16,
        minTeams: minTeams ? Number(minTeams) : 4,
        format: format ?? "SINGLE_ELIMINATION",
        ageCategory: ageCategory || null,
        gender: gender || null,
        rules: rules || null,
        prizeMoney: prizeMoney || null,
        category: category || null,
        status: "DRAFT",
      },
    });

    await logAudit({
      userId: session!.id,
      action: "TOURNAMENT_CREATE",
      entity: "Tournament",
      entityId: tournament.id,
      detail: `Created tournament "${tournament.name}" (${tournament.sport}) — status: DRAFT`,
    });

    // Notify admins
    const admins = await db.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    for (const a of admins) {
      await notify({
        userId: a.id,
        title: "New tournament draft",
        message: `Organizer ${session!.name} created "${tournament.name}" (draft). Will be submitted for approval before going live.`,
        type: "SYSTEM",
        link: "/admin/tournaments",
      });
    }

    return json({ tournament }, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer tournaments POST", e);
    return errorResponse("Failed to create tournament", 500);
  }
}
