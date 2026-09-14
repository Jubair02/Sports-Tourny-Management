import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { MapPin } from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function VenuesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });
  const tournament = await db.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, organizerId: true, venueId: true },
  });
  if (!tournament) notFound();
  if (session.role !== "ADMIN" && (!prof || prof.id !== tournament.organizerId)) notFound();

  // Tournament's primary venue + any venues used by its matches
  const [primaryVenue, matchesWithVenues] = await Promise.all([
    tournament.venueId
      ? db.venue.findUnique({ where: { id: tournament.venueId } })
      : Promise.resolve(null),
    db.match.findMany({
      where: { tournamentId: id, venueId: { not: null } },
      include: { venue: true, homeTeam: true, awayTeam: true },
      orderBy: { matchDate: "asc" },
    }),
  ]);

  const venueMap = new Map<string, { venue: any; matches: typeof matchesWithVenues }>();
  if (primaryVenue) {
    venueMap.set(primaryVenue.id, { venue: primaryVenue, matches: [] });
  }
  for (const m of matchesWithVenues) {
    if (m.venue) {
      const existing = venueMap.get(m.venue.id);
      if (existing) {
        existing.matches.push(m);
      } else {
        venueMap.set(m.venue.id, { venue: m.venue, matches: [m] });
      }
    }
  }

  const venues = [...venueMap.values()];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Link href={`/organizer/tournaments/${id}`} className="text-muted-foreground hover:text-foreground">Tournaments</Link>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span>Venues</span>
          </> as any
        }
        description={`Venues hosting ${tournament.name}.`}
      />

      {venues.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No venues linked"
          description="Assign a venue to the tournament in Settings, or schedule matches at a venue."
        />
      ) : (
        <div className="space-y-4">
          {venues.map(({ venue, matches }) => (
            <Card key={venue.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{venue.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[venue.division, venue.district, venue.upazila, venue.address].filter(Boolean).join(", ")}
                    </p>
                    {venue.capacity && (
                      <p className="mt-1 text-xs text-muted-foreground">Capacity: {venue.capacity.toLocaleString()}</p>
                    )}
                  </div>
                  {venue.id === tournament.venueId && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Primary</span>
                  )}
                </div>

                {matches.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Matches at this venue ({matches.length})
                    </p>
                    <div className="mt-2 max-h-48 divide-y overflow-y-auto scrollbar-thin">
                      {matches.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 py-1.5 text-xs">
                          <span className="font-mono text-[10px] text-muted-foreground">{m.matchCode}</span>
                          <span className="truncate">
                            {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
                          </span>
                          <span className="ml-auto text-muted-foreground">
                            {m.matchDate ? formatDateTime(m.matchDate) : "TBD"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
