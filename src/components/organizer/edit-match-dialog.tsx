"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MATCH_ROUNDS } from "@/lib/constants";

type Venue = { id: string; name: string };

type Props = {
  tournamentId: string;
  matchId: string;
  matchCode?: string | null;
  matchDate?: string | null;
  venueId?: string | null;
  round?: string | null;
  trigger?: React.ReactNode;
  venues: Venue[];
};

function toDateInput(d?: string | null) {
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export function EditMatchDialog({
  tournamentId, matchId, matchCode, matchDate, venueId, round, trigger, venues,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(toDateInput(matchDate));
  const [venId, setVenId] = useState(venueId ?? "");
  const [rnd, setRnd] = useState(round ?? "");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDate(toDateInput(matchDate));
      setVenId(venueId ?? "");
      setRnd(round ?? "");
    }
    setOpen(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/organizer/tournaments/${tournamentId}/matches/${matchId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchDate: date ? new Date(date).toISOString() : null,
            venueId: venId || null,
            round: rnd || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to update match");
          return;
        }
        toast.success(`Match ${matchCode ?? matchId.slice(-4)} updated`);
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-8">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Match {matchCode ?? ""}</DialogTitle>
          <DialogDescription>Update schedule, venue, or round.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="m-date">Match Date &amp; Time</Label>
            <Input id="m-date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-venue">Venue</Label>
            <Select value={venId} onValueChange={setVenId}>
              <SelectTrigger id="m-venue"><SelectValue placeholder="— None —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— None —</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-round">Round</Label>
            <Select value={rnd} onValueChange={setRnd}>
              <SelectTrigger id="m-round"><SelectValue placeholder="— None —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— None —</SelectItem>
                {MATCH_ROUNDS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
