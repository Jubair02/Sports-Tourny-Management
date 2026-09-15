"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  SPORTS, TOURNAMENT_FORMATS, FORMAT_META, TOURNAMENT_CATEGORIES, BANGLADESH_DIVISIONS,
} from "@/lib/constants";

type Venue = { id: string; name: string };
type Props = {
  tournamentId: string;
  tournament: {
    name: string;
    sport: string;
    description: string;
    division?: string | null;
    district?: string | null;
    upazila?: string | null;
    location?: string | null;
    venueId?: string | null;
    startDate: string; endDate: string;
    regStart: string; regDeadline: string;
    entryFee: number; maxTeams: number; minTeams: number;
    format: string;
    ageCategory?: string | null;
    gender?: string | null;
    rules?: string | null;
    prizeMoney?: string | null;
    category?: string | null;
    winPoints: number; drawPoints: number; lossPoints: number;
  };
};

function toDateInput(d: string) {
  if (!d) return "";
  try { return new Date(d).toISOString().slice(0, 10); } catch { return ""; }
}

export function TournamentSettingsForm({ tournamentId, tournament }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [venues, setVenues] = useState<Venue[]>([]);

  useEffect(() => {
    fetch("/api/admin/venues")
      .then((r) => (r.ok ? r.json() : { venues: [] }))
      .then((d) => setVenues(d.venues ?? []))
      .catch(() => setVenues([]));
  }, []);

  const [name, setName] = useState(tournament.name);
  const [description, setDescription] = useState(tournament.description);
  const [division, setDivision] = useState(tournament.division ?? "Dhaka");
  const [district, setDistrict] = useState(tournament.district ?? "Dhaka");
  const [upazila, setUpazila] = useState(tournament.upazila ?? "");
  const [location, setLocation] = useState(tournament.location ?? "");
  const [venueId, setVenueId] = useState(tournament.venueId ?? "");
  const [startDate, setStartDate] = useState(toDateInput(tournament.startDate));
  const [endDate, setEndDate] = useState(toDateInput(tournament.endDate));
  const [regStart, setRegStart] = useState(toDateInput(tournament.regStart));
  const [regDeadline, setRegDeadline] = useState(toDateInput(tournament.regDeadline));
  const [entryFee, setEntryFee] = useState(String(tournament.entryFee));
  const [maxTeams, setMaxTeams] = useState(String(tournament.maxTeams));
  const [minTeams, setMinTeams] = useState(String(tournament.minTeams));
  const [format, setFormat] = useState(tournament.format);
  const [ageCategory, setAgeCategory] = useState(tournament.ageCategory ?? "");
  const [gender, setGender] = useState(tournament.gender ?? "");
  const [rules, setRules] = useState(tournament.rules ?? "");
  const [prizeMoney, setPrizeMoney] = useState(tournament.prizeMoney ?? "");
  const [category, setCategory] = useState(tournament.category ?? "");
  const [winPoints, setWinPoints] = useState(String(tournament.winPoints));
  const [drawPoints, setDrawPoints] = useState(String(tournament.drawPoints));
  const [lossPoints, setLossPoints] = useState(String(tournament.lossPoints));

  const districts = BANGLADESH_DIVISIONS[division] ?? [];

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/organizer/tournaments/${tournamentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, description, division, district,
            upazila: upazila || null,
            location: location || null,
            venueId: venueId || null,
            startDate, endDate, regStart, regDeadline,
            entryFee: Number(entryFee) || 0,
            maxTeams: Number(maxTeams) || 16,
            minTeams: Number(minTeams) || 4,
            format,
            ageCategory: ageCategory || null,
            gender: gender || null,
            rules: rules || null,
            prizeMoney: prizeMoney || null,
            category: category || null,
            winPoints: Number(winPoints),
            drawPoints: Number(drawPoints),
            lossPoints: Number(lossPoints),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to save");
          return;
        }
        toast.success("Tournament updated");
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Basic Info</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="s-name">Tournament Name</Label>
            <Input id="s-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-sport">Sport</Label>
            <Select value={tournament.sport} disabled>
              <SelectTrigger id="s-sport"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(SPORTS).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Sport cannot be changed after creation.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="s-format"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(TOURNAMENT_FORMATS).map((f) => (
                  <SelectItem key={f} value={f}>{FORMAT_META[f]?.label ?? f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">{FORMAT_META[format]?.desc}</p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="s-desc">Description</Label>
            <Textarea id="s-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Location &amp; Venue</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="s-div">Division</Label>
            <Select value={division} onValueChange={(v) => { setDivision(v); setDistrict((BANGLADESH_DIVISIONS[v] ?? [""])[0]); }}>
              <SelectTrigger id="s-div"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(BANGLADESH_DIVISIONS).map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-dis">District</Label>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger id="s-dis"><SelectValue /></SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-upz">Upazila</Label>
            <Input id="s-upz" value={upazila} onChange={(e) => setUpazila(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-loc">Location label</Label>
            <Input id="s-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="s-venue">Venue</Label>
            <Select value={venueId} onValueChange={setVenueId}>
              <SelectTrigger id="s-venue"><SelectValue placeholder="— None —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— None —</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Dates &amp; Entry</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="s-sd">Start</Label>
            <Input id="s-sd" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-ed">End</Label>
            <Input id="s-ed" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-rs">Reg. Start</Label>
            <Input id="s-rs" type="date" value={regStart} onChange={(e) => setRegStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-rd">Reg. Deadline</Label>
            <Input id="s-rd" type="date" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-fee">Entry Fee (৳)</Label>
            <Input id="s-fee" type="number" min="0" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-max">Max Teams</Label>
            <Input id="s-max" type="number" min="2" value={maxTeams} onChange={(e) => setMaxTeams(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-min">Min Teams</Label>
            <Input id="s-min" type="number" min="2" value={minTeams} onChange={(e) => setMinTeams(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-prize">Prize Money</Label>
            <Input id="s-prize" value={prizeMoney} onChange={(e) => setPrizeMoney(e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Categories &amp; Classification</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="s-age">Age Category</Label>
            <Input id="s-age" value={ageCategory} onChange={(e) => setAgeCategory(e.target.value)} placeholder="e.g. U-19" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger id="s-gender"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— None —</SelectItem>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="MIXED">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-cat">Tournament Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="s-cat"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— None —</SelectItem>
                {Object.values(TOURNAMENT_CATEGORIES).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Scoring Rules</h3>
        <p className="mb-2 text-xs text-muted-foreground">Points awarded per match outcome. Affects standings when results are approved.</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="s-win">Win Points</Label>
            <Input id="s-win" type="number" min="0" value={winPoints} onChange={(e) => setWinPoints(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-draw">Draw Points</Label>
            <Input id="s-draw" type="number" min="0" value={drawPoints} onChange={(e) => setDrawPoints(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-loss">Loss Points</Label>
            <Input id="s-loss" type="number" min="0" value={lossPoints} onChange={(e) => setLossPoints(e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Rules &amp; Regulations</h3>
        <Textarea rows={5} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Tournament rules, code of conduct, eligibility…" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
