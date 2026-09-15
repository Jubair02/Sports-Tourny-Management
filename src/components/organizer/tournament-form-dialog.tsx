"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trophy, Plus, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  SPORTS, SPORT_META, TOURNAMENT_FORMATS, FORMAT_META, TOURNAMENT_CATEGORIES, CATEGORY_META,
  BANGLADESH_DIVISIONS,
} from "@/lib/constants";

type Venue = { id: string; name: string; district?: string | null };

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export function TournamentFormDialog({
  trigger,
  organizers,
}: {
  trigger?: React.ReactNode;
  // When provided, the dialog runs in admin mode: the admin picks which organizer
  // owns the tournament, and it redirects back to the admin list on success.
  organizers?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const isAdmin = Array.isArray(organizers);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [organizerId, setOrganizerId] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/venues")
      .then((r) => (r.ok ? r.json() : { venues: [] }))
      .then((d) => setVenues(d.venues ?? []))
      .catch(() => setVenues([]));
  }, [open]);

  const [name, setName] = useState("");
  const [sport, setSport] = useState<string>("FOOTBALL");
  const [description, setDescription] = useState("");
  const [division, setDivision] = useState<string>("Dhaka");
  const [district, setDistrict] = useState<string>("Dhaka");
  const [upazila, setUpazila] = useState("");
  const [location, setLocation] = useState("");
  const [venueId, setVenueId] = useState("");
  const [startDate, setStartDate] = useState(plusDays(7));
  const [endDate, setEndDate] = useState(plusDays(14));
  const [regStart, setRegStart] = useState(today());
  const [regDeadline, setRegDeadline] = useState(plusDays(5));
  const [entryFee, setEntryFee] = useState("0");
  const [maxTeams, setMaxTeams] = useState("16");
  const [minTeams, setMinTeams] = useState("4");
  const [format, setFormat] = useState<string>(TOURNAMENT_FORMATS.SINGLE_ELIMINATION);
  const [ageCategory, setAgeCategory] = useState("");
  const [gender, setGender] = useState("");
  const [rules, setRules] = useState("");
  const [prizeMoney, setPrizeMoney] = useState("");
  const [category, setCategory] = useState("");

  const districts = BANGLADESH_DIVISIONS[division] ?? [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error("Name and description are required");
      return;
    }
    if (isAdmin && !organizerId) {
      toast.error("Select an organizer to own this tournament");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/organizer/tournaments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, sport, description,
            division, district, upazila: upazila || undefined, location: location || undefined,
            venueId: venueId || undefined,
            startDate, endDate, regStart, regDeadline,
            entryFee: Number(entryFee) || 0,
            maxTeams: Number(maxTeams) || 16,
            minTeams: Number(minTeams) || 4,
            format,
            ageCategory: ageCategory || undefined,
            gender: gender || undefined,
            rules: rules || undefined,
            prizeMoney: prizeMoney || undefined,
            category: category || undefined,
            organizerId: isAdmin ? organizerId : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to create tournament");
          return;
        }
        toast.success("Tournament draft created");
        setOpen(false);
        // Reset
        setName(""); setDescription(""); setRules("");
        router.refresh();
        // Navigate to the new tournament (admins stay in the admin section).
        if (data.tournament?.id) {
          router.push(isAdmin ? "/admin/tournaments" : `/organizer/tournaments/${data.tournament.id}`);
        }
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            Create Tournament
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Create New Tournament
          </DialogTitle>
          <DialogDescription>
            Fill in tournament details. Status will be <strong>Draft</strong>
            {isAdmin ? " — the chosen organizer can then manage and submit it." : " — submit for admin approval when ready."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="t-organizer">Organizer *</Label>
              <Select value={organizerId} onValueChange={setOrganizerId}>
                <SelectTrigger id="t-organizer"><SelectValue placeholder="— Select owning organizer —" /></SelectTrigger>
                <SelectContent>
                  {organizers!.length === 0 ? (
                    <SelectItem value="_none" disabled>No approved organizers</SelectItem>
                  ) : (
                    organizers!.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This organizer will own and manage the tournament.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="t-name">Tournament Name *</Label>
            <Input id="t-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mirpur Premier Football League 2025" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-sport">Sport *</Label>
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger id="t-sport"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(SPORTS).map((s) => (
                    <SelectItem key={s} value={s}>{SPORT_META[s]?.emoji} {SPORT_META[s]?.label ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-format">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger id="t-format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(TOURNAMENT_FORMATS).map((f) => (
                    <SelectItem key={f} value={f}>{FORMAT_META[f]?.label ?? f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{FORMAT_META[format]?.desc}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-desc">Description *</Label>
            <Textarea id="t-desc" required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief overview of the tournament…" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="t-div">Division</Label>
              <Select value={division} onValueChange={(v) => { setDivision(v); setDistrict((BANGLADESH_DIVISIONS[v] ?? [""])[0]); }}>
                <SelectTrigger id="t-div"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(BANGLADESH_DIVISIONS).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-dis">District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger id="t-dis"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-upz">Upazila / Area</Label>
              <Input id="t-upz" value={upazila} onChange={(e) => setUpazila(e.target.value)} placeholder="e.g. Mirpur" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-loc">Location label</Label>
              <Input id="t-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mirpur Indoor Stadium" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-venue">Venue</Label>
              <Select value={venueId} onValueChange={setVenueId}>
                <SelectTrigger id="t-venue"><SelectValue placeholder="— Select venue (optional) —" /></SelectTrigger>
                <SelectContent>
                  {venues.length === 0 ? (
                    <SelectItem value="_none" disabled>No venues available</SelectItem>
                  ) : (
                    venues.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}{v.district ? ` · ${v.district}` : ""}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="t-sd">Start Date *</Label>
              <Input id="t-sd" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-ed">End Date *</Label>
              <Input id="t-ed" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-rs">Registration Start *</Label>
              <Input id="t-rs" type="date" required value={regStart} onChange={(e) => setRegStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-rd">Registration Deadline *</Label>
              <Input id="t-rd" type="date" required value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="t-fee">Entry Fee (৳)</Label>
              <Input id="t-fee" type="number" min="0" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-max">Max Teams</Label>
              <Input id="t-max" type="number" min="2" value={maxTeams} onChange={(e) => setMaxTeams(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-min">Min Teams</Label>
              <Input id="t-min" type="number" min="2" value={minTeams} onChange={(e) => setMinTeams(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-prize">Prize Money</Label>
              <Input id="t-prize" value={prizeMoney} onChange={(e) => setPrizeMoney(e.target.value)} placeholder="e.g. 50,000 BDT" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="t-cat">Age Category</Label>
              <Input id="t-cat" value={ageCategory} onChange={(e) => setAgeCategory(e.target.value)} placeholder="e.g. U-19 / Open" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="t-gender"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="MIXED">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-tcat">Tournament Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="t-tcat"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {Object.values(TOURNAMENT_CATEGORIES).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_META[c] ?? c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-rules">Rules &amp; Regulations</Label>
            <Textarea id="t-rules" rows={3} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Tournament rules, eligibility, code of conduct…" />
          </div>

          <DialogFooter className="sticky bottom-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create Draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
