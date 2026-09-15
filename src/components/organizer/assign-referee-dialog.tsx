"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flag, Loader2, Save, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Referee = { id: string; name: string; specialization?: string | null; district?: string | null };

type Props = {
  tournamentId: string;
  matchId: string;
  matchCode?: string | null;
  currentRefereeId?: string | null;
  referees: Referee[];
  trigger?: React.ReactNode;
};

export function AssignRefereeDialog({
  tournamentId, matchId, matchCode, currentRefereeId, referees, trigger,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [refId, setRefId] = useState(currentRefereeId ?? "");

  const handleOpenChange = (next: boolean) => {
    if (next) setRefId(currentRefereeId ?? "");
    setOpen(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refId || refId === "_none") {
      toast.error("Please select a referee");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/organizer/tournaments/${tournamentId}/matches/${matchId}/assign-referee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refereeId: refId }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to assign referee");
          return;
        }
        toast.success(`Referee assigned to match ${matchCode ?? matchId.slice(-4)}`);
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
            <UserCog className="h-3.5 w-3.5" />
            Assign Referee
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Assign Referee — Match {matchCode ?? ""}
          </DialogTitle>
          <DialogDescription>The referee will be notified and can then submit results after the match.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Select value={refId} onValueChange={setRefId}>
            <SelectTrigger><SelectValue placeholder="— Select referee —" /></SelectTrigger>
            <SelectContent>
              {referees.length === 0 ? (
                <SelectItem value="_none" disabled>No referees registered</SelectItem>
              ) : (
                referees.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}{r.specialization ? ` · ${r.specialization}` : ""}{r.district ? ` · ${r.district}` : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
