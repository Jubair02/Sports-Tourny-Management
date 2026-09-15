import { getSession, errorResponse, type SessionUser } from "./auth";
import { db } from "./db";

/**
 * Shared guard for Organizer-side API routes.
 * - Session must exist and role must be ORGANIZER or ADMIN.
 * - ADMIN bypasses ownership checks (for oversight).
 * - For ORGANIZER: requires an APPROVED OrganizerProfile, and the tournament
 *   must belong to that profile.
 *
 * Usage:
 *   const { session, error } = await ensureOrganizerOfTournament(tournamentId);
 *   if (error) return error;
 *   // ... use session.id for audit logs
 */
export async function ensureOrganizerOfTournament(
  tournamentId: string,
): Promise<{ session: SessionUser | null; error: Response | null }> {
  const session = await getSession();
  if (!session) return { session: null, error: errorResponse("Unauthorized", 401) };
  if (!["ORGANIZER", "ADMIN"].includes(session.role)) {
    return { session, error: errorResponse("Forbidden", 403) };
  }
  if (session.role === "ADMIN") return { session, error: null };

  const prof = await db.organizerProfile.findUnique({ where: { userId: session.id } });
  if (!prof || prof.approvalStatus !== "APPROVED") {
    return { session, error: errorResponse("Organizer not approved", 403) };
  }
  const t = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { organizerId: true },
  });
  if (!t || t.organizerId !== prof.id) {
    return { session, error: errorResponse("Not your tournament", 403) };
  }
  return { session, error: null };
}

/**
 * Resolve the caller's OrganizerProfile (or null for ADMIN). Use this when the
 * route doesn't reference a specific tournament (e.g. listing/creating tournaments).
 */
export async function getOrganizerContext(): Promise<{
  session: SessionUser | null;
  prof: { id: string; approvalStatus: string } | null;
  error: Response | null;
}> {
  const session = await getSession();
  if (!session) return { session: null, prof: null, error: errorResponse("Unauthorized", 401) };
  if (!["ORGANIZER", "ADMIN"].includes(session.role)) {
    return { session, prof: null, error: errorResponse("Forbidden", 403) };
  }
  if (session.role === "ADMIN") return { session, prof: null, error: null };
  const prof = await db.organizerProfile.findUnique({
    where: { userId: session.id },
    select: { id: true, approvalStatus: true },
  });
  if (!prof) return { session, prof: null, error: errorResponse("Organizer profile not found", 403) };
  if (prof.approvalStatus !== "APPROVED") {
    return { session, prof, error: errorResponse("Organizer not approved", 403) };
  }
  return { session, prof, error: null };
}
