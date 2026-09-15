import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganizerVenuesPage() {
  const session = await getSession();
  if (!session) return null;

  const venues = await db.venue.findMany({
    include: { _count: { select: { matches: true, tournaments: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Venues"
        description="All venues registered on the platform."
      />

      {venues.length === 0 ? (
        <EmptyState icon={MapPin} title="No venues yet" description="Venues are created by admins." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => {
            let facilities: string[] = [];
            try {
              facilities = v.facilities ? JSON.parse(v.facilities) : [];
            } catch {
              facilities = [];
            }
            return (
              <Card key={v.id}>
                <CardContent className="p-4">
                  <p className="font-semibold">{v.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[v.division, v.district, v.upazila].filter(Boolean).join(", ")}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {v._count.tournaments} tournaments
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {v._count.matches} matches
                    </span>
                  </div>
                  {facilities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {facilities.slice(0, 5).map((f) => (
                        <span key={f} className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">{f}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
