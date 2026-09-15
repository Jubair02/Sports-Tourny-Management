"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BANGLADESH_DIVISIONS } from "@/lib/constants";

const FACILITY_OPTIONS = ["Parking", "Cafeteria", "Prayer Room", "First Aid", "Washroom", "Flood Lights", "Scoreboard", "Seating", "Changing Room"];

export function VenueFormDialog({
  mode = "create",
  venue,
  trigger,
}: {
  mode?: "create" | "edit";
  venue?: {
    id: string;
    name: string;
    division: string;
    district: string;
    upazila?: string | null;
    address?: string | null;
    capacity?: number | null;
    facilities?: string | null;
    image?: string | null;
  };
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(venue?.name ?? "");
  const [division, setDivision] = useState(venue?.division ?? "Dhaka");
  const [district, setDistrict] = useState(venue?.district ?? "Dhaka");
  const [upazila, setUpazila] = useState(venue?.upazila ?? "");
  const [address, setAddress] = useState(venue?.address ?? "");
  const [capacity, setCapacity] = useState(venue?.capacity ? String(venue.capacity) : "");
  const [image, setImage] = useState(venue?.image ?? "");
  const [facilities, setFacilities] = useState<string[]>(() => {
    try {
      return venue?.facilities ? JSON.parse(venue.facilities) : [];
    } catch {
      return [];
    }
  });

  const districts = BANGLADESH_DIVISIONS[division] ?? [];

  const toggleFacility = (f: string) =>
    setFacilities((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload: any = {
          name,
          division,
          district,
          upazila: upazila || undefined,
          address: address || undefined,
          capacity: capacity ? Number(capacity) : undefined,
          image: image || undefined,
          facilities,
        };
        const url =
          mode === "create"
            ? "/api/admin/venues"
            : `/api/admin/venues/${venue!.id}`;
        const method = mode === "create" ? "POST" : "PATCH";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to save venue");
          return;
        }
        toast.success(mode === "create" ? "Venue created" : "Venue updated");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={mode === "edit" ? "outline" : "default"} size="sm" className="h-8">
            {mode === "create" ? <Plus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {mode === "create" ? "Create Venue" : "Edit"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {mode === "create" ? "Create New Venue" : "Edit Venue"}
          </DialogTitle>
          <DialogDescription>
            Add a venue where tournaments &amp; matches can be held.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vname">Venue name *</Label>
            <Input id="vname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bangabandhu National Stadium" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vdiv">Division *</Label>
              <Select value={division} onValueChange={(v) => { setDivision(v); setDistrict((BANGLADESH_DIVISIONS[v] ?? [""])[0]); }}>
                <SelectTrigger id="vdiv"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(BANGLADESH_DIVISIONS).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vdis">District *</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger id="vdis"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vupz">Upazila / Area</Label>
              <Input id="vupz" value={upazila} onChange={(e) => setUpazila(e.target.value)} placeholder="e.g. Motijheel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vcap">Capacity</Label>
              <Input id="vcap" type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 36000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vaddr">Address</Label>
            <Input id="vaddr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full street address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vimg">Image URL</Label>
            <Input id="vimg" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <Label>Facilities</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FACILITY_OPTIONS.map((f) => (
                <label key={f} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm cursor-pointer hover:bg-accent">
                  <Checkbox checked={facilities.includes(f)} onCheckedChange={() => toggleFacility(f)} />
                  {f}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === "create" ? "Create Venue" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
