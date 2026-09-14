import Link from "next/link";
import { MapPin, Users, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { pickImage, VENUE_IMAGES } from "./images";

type VenueCardProps = {
  venue: {
    id: string;
    name: string;
    division?: string | null;
    district?: string | null;
    upazila?: string | null;
    address?: string | null;
    capacity?: number | null;
    facilities?: string | null;
    image?: string | null;
    _count?: { matches?: number; tournaments?: number };
  };
  className?: string;
};

function parseFacilities(s?: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
    return [];
  } catch {
    return s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  }
}

export function VenueCard({ venue, className }: VenueCardProps) {
  const image = venue.image || pickImage(VENUE_IMAGES, venue.id);
  const facilities = parseFacilities(venue.facilities).slice(0, 3);
  const extraCount = Math.max(0, parseFacilities(venue.facilities).length - 3);
  const matchesCount = venue._count?.matches ?? 0;
  const tourneysCount = venue._count?.tournaments ?? 0;

  return (
    <Link href={`/venues/${venue.id}`} className="group block">
      <Card className={cn("overflow-hidden p-0 py-0 transition-all hover:shadow-md hover:-translate-y-0.5", className)}>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <img src={image} alt={venue.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {venue.capacity != null && venue.capacity > 0 && (
            <Badge className="absolute right-3 top-3 bg-white/90 text-foreground">
              <Users className="h-3 w-3" /> {venue.capacity.toLocaleString()}
            </Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="line-clamp-1 font-bold text-white">{venue.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">
                {[venue.upazila, venue.district, venue.division].filter(Boolean).join(", ") || "Bangladesh"}
              </span>
            </p>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {facilities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {facilities.map((f) => (
                <Badge key={f} variant="secondary" className="text-[10px]">
                  {f}
                </Badge>
              ))}
              {extraCount > 0 && (
                <Badge variant="outline" className="text-[10px]">+{extraCount} more</Badge>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 border-t pt-3 text-center text-xs">
            <div className="flex flex-col items-center gap-0.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold">{tourneysCount}</span>
              <span className="text-[10px] uppercase text-muted-foreground">Tournaments</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold">{matchesCount}</span>
              <span className="text-[10px] uppercase text-muted-foreground">Matches</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
