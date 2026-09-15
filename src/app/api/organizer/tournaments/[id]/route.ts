import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/auth";
import { ensureOrganizerOfTournament } from "@/lib/api-guard";
import {
  SPORTS, TOURNAMENT_FORMATS, TOURNAMENT_CATEGORIES, BANGLADESH_DIVISIONS,
} from "@/lib/constants";
import { slugify, logAudit } from "@/lib/helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        venue: true,
        organizer: { include: { user: true } },
        registrations: {
          include: {
            team: {
              include: {
                manager: { include: { user: true } },
                _count: { select: { players: true } },
              },
            },
          },
          orderBy: { registeredAt: "desc" },
        },
        participants: { include: { team: true } },
        matches: {
          include: {
            homeTeam: true, awayTeam: true, venue: true,
            assignment: { include: { referee: { include: { user: true } } } },
          },
          orderBy: { matchDate: "asc" },
        },
        standings: { include: { team: true }, orderBy: [{ points: "desc" }, { goalsFor: "desc" }] },
        announcements: { include: { author: true }, orderBy: { createdAt: "desc" } },
        _count: { select: { registrations: true, matches: true, participants: true } },
      },
    });
    if (!tournament) return errorResponse("Tournament not found", 404);

    return json({ tournament });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer tournament GET", e);
    return errorResponse("Failed to fetch tournament", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { session, error } = await ensureOrganizerOfTournament(id);
    if (error) return error;

    const body = await req.json();
    const {
      name, sport, description, division, district, upazila, location, venueId,
      startDate, endDate, regStart, regDeadline, entryFee, maxTeams, minTeams,
      format, ageCategory, gender, rules, prizeMoney, category,
      winPoints, drawPoints, lossPoints,
    } = body as Record<string, unknown>;

    const data: Record<string, unknown> = {};

    if (typeof name === "string" && name.trim()) {
      data.name = name.trim();
      // re-slug if name changed and slug is taken by another tournament
      let slug = slugify(name.trim());
      let suffix = 1;
      while (true) {
        const found = await db.tournament.findUnique({ where: { slug }, select: { id: true } });
        if (!found || found.id === id) break;
        slug = `${slugify(name.trim())}-${suffix++}`;
      }
      data.slug = slug;
    }
    if (typeof sport === "string") {
      if (!Object.values(SPORTS).includes(sport as any)) return errorResponse("Invalid sport", 400);
      data.sport = sport;
    }
    if (typeof description === "string") data.description = description;
    if (typeof division === "string") {
      if (division && !BANGLADESH_DIVISIONS[division]) return errorResponse("Invalid division", 400);
      data.division = division || null;
    }
    if (typeof district === "string") {
      const dv = typeof division === "string" ? division : (await db.tournament.findUnique({ where: { id }, select: { division: true } }))?.division;
      if (district && dv && !BANGLADESH_DIVISIONS[dv]?.includes(district)) return errorResponse("District does not match division", 400);
      data.district = district || null;
    }
    if (typeof upazila === "string") data.upazila = upazila || null;
    if (typeof location === "string") data.location = location || null;
    if (typeof venueId === "string") data.venueId = venueId || null;
    if (startDate !== undefined) {
      const d = new Date(String(startDate));
      if (isNaN(d.getTime())) return errorResponse("Invalid startDate", 400);
      data.startDate = d;
    }
    if (endDate !== undefined) {
      const d = new Date(String(endDate));
      if (isNaN(d.getTime())) return errorResponse("Invalid endDate", 400);
      data.endDate = d;
    }
    if (regStart !== undefined) {
      const d = new Date(String(regStart));
      if (isNaN(d.getTime())) return errorResponse("Invalid regStart", 400);
      data.regStart = d;
    }
    if (regDeadline !== undefined) {
      const d = new Date(String(regDeadline));
      if (isNaN(d.getTime())) return errorResponse("Invalid regDeadline", 400);
      data.regDeadline = d;
    }
    if (entryFee !== undefined) data.entryFee = Number(entryFee) || 0;
    if (maxTeams !== undefined) data.maxTeams = Number(maxTeams) || 16;
    if (minTeams !== undefined) data.minTeams = Number(minTeams) || 4;
    if (typeof format === "string") {
      if (!Object.values(TOURNAMENT_FORMATS).includes(format as any)) return errorResponse("Invalid format", 400);
      data.format = format;
    }
    if (typeof ageCategory === "string") data.ageCategory = ageCategory || null;
    if (typeof gender === "string") data.gender = gender || null;
    if (typeof rules === "string") data.rules = rules || null;
    if (typeof prizeMoney === "string") data.prizeMoney = prizeMoney || null;
    if (typeof category === "string") {
      if (category && !Object.values(TOURNAMENT_CATEGORIES).includes(category as any)) return errorResponse("Invalid category", 400);
      data.category = category || null;
    }
    if (winPoints !== undefined) data.winPoints = Number(winPoints);
    if (drawPoints !== undefined) data.drawPoints = Number(drawPoints);
    if (lossPoints !== undefined) data.lossPoints = Number(lossPoints);

    const updated = await db.tournament.update({ where: { id }, data });

    await logAudit({
      userId: session!.id,
      action: "TOURNAMENT_UPDATE",
      entity: "Tournament",
      entityId: id,
      detail: `Updated tournament "${updated.name}" (${Object.keys(data).join(", ") || "no changes"})`,
    });

    return json({ tournament: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("organizer tournament PATCH", e);
    return errorResponse("Failed to update tournament", 500);
  }
}
