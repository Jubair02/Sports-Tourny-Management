import { MapPin } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { VenueCard } from "@/components/public/venue-card";
import { getVenues } from "@/lib/queries";

export default async function VenuesPage() {
  const venues = await getVenues();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Venues"
        description="Discover stadiums, fields, and grounds across Bangladesh that host TourneyBD events."
      />

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">{venues.length}</span> venue{venues.length === 1 ? "" : "s"} registered
        </p>
      </div>

      {venues.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={MapPin}
            title="No venues registered yet"
            description="Venues will appear here as organizers associate them with tournaments."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => <VenueCard key={v.id} venue={v} />)}
        </div>
      )}
    </div>
  );
}
