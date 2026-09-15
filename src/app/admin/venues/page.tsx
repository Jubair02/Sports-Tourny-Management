import { db } from "@/lib/db";
import { getVenues } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { VenueFormDialog } from "@/components/admin/venue-form-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { MapPin, Users, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const venues = await getVenues();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Venues"
        description="All registered venues for tournaments and matches."
      >
        <VenueFormDialog mode="create" />
      </PageHeader>

      {venues.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No venues yet"
          description="Create your first venue to start hosting matches."
          action={<VenueFormDialog mode="create" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v: any) => {
            let facilities: string[] = [];
            try {
              facilities = v.facilities ? JSON.parse(v.facilities) : [];
            } catch {}
            return (
              <Card key={v.id} className="overflow-hidden">
                <div className="relative h-32 w-full bg-gradient-to-br from-emerald-500/20 via-emerald-700/15 to-amber-500/15">
                  {v.image ? (
                    <img src={v.image} alt={v.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <MapPin className="h-10 w-10 text-emerald-500/40" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold leading-tight">{v.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {v.upazila ? `${v.upazila}, ` : ""}{v.district}, {v.division}
                    </p>
                  </div>
                  {v.address && <p className="text-xs text-muted-foreground line-clamp-2">{v.address}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {v.capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {v.capacity.toLocaleString()} cap.
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" /> {v._count?.tournaments ?? 0} tournaments
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {v._count?.matches ?? 0} matches
                    </span>
                  </div>
                  {facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {facilities.map((f) => (
                        <StatusBadge key={f} label={f} color="secondary" />
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end pt-1">
                    <VenueFormDialog mode="edit" venue={v} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
