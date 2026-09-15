import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json, errorResponse } from "@/lib/auth";
import { logAudit, slugify } from "@/lib/helpers";
import { BANGLADESH_DIVISIONS } from "@/lib/constants";

const ALL_DISTRICTS = Object.values(BANGLADESH_DIVISIONS).flat();

async function getManagerContext() {
  const session = await getSession();
  if (!session) return { session: null, error: errorResponse("Unauthorized", 401) };
  if (!["TEAM_MANAGER", "ADMIN"].includes(session.role)) return { session, error: errorResponse("Forbidden", 403) };
  let prof = await db.teamManagerProfile.findUnique({ where: { userId: session.id } });
  if (!prof && session.role === "ADMIN") {
    prof = await db.teamManagerProfile.findFirst();
  }
  if (!prof) return { session, error: errorResponse("No team manager profile found", 403) };
  return { session, prof, error: null };
}

export async function GET() {
  const { session, prof, error } = await getManagerContext();
  if (error) return error;
  const teams = await db.team.findMany({
    where: { managerId: prof!.id },
    include: {
      players: { select: { id: true, verificationStatus: true } },
      registrations: { include: { tournament: { select: { id: true, name: true, sport: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return json({ teams });
}

export async function POST(req: NextRequest) {
  try {
    const { session, prof, error } = await getManagerContext();
    if (error) return error;

    const body = await req.json();
    const { name, logo, captain, phone, email, district, address, description } = body as {
      name: string;
      logo?: string;
      captain?: string;
      phone?: string;
      email?: string;
      district?: string;
      address?: string;
      description?: string;
    };

    if (!name || !name.trim()) return errorResponse("Team name is required", 400);
    if (district && !ALL_DISTRICTS.includes(district)) return errorResponse("Invalid district", 400);

    // Build a unique slug
    const baseSlug = slugify(name) || `team-${Date.now().toString(36)}`;
    let slug = baseSlug;
    let suffix = 1;
    while (await db.team.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const team = await db.team.create({
      data: {
        name: name.trim(),
        slug,
        logo: logo?.trim() || null,
        captain: captain?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        district: district ?? "Dhaka",
        address: address?.trim() || null,
        description: description?.trim() || null,
        managerId: prof!.id,
      },
    });

    await logAudit({
      userId: session!.id,
      action: "TEAM_CREATE",
      entity: "Team",
      entityId: team.id,
      detail: `Created team "${team.name}" (slug: ${team.slug})`,
    });

    return json({ team }, 201);
  } catch (e) {
    console.error("team POST error", e);
    return errorResponse("Failed to create team", 500);
  }
}
