"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, ShieldAlert } from "lucide-react";
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
import { DISPUTE_TYPES, DISPUTE_TYPE_META } from "@/lib/constants";

type Opt = { id: string; label: string };

export function RaiseDisputeDialog({
  tournaments,
  matches,
  presetTournamentId,
  type,
  presetTitle,
  trigger,
}: {
  tournaments?: Opt[];
  matches?: Opt[];
  presetTournamentId?: string;
  type?: string;
  presetTitle?: string;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [disputeType, setDisputeType] = useState(type ?? DISPUTE_TYPES.OTHER);
  const [title, setTitle] = useState(presetTitle ?? "");
  const [description, setDescription] = useState("");
  const [tournamentId, setTournamentId] = useState(presetTournamentId ?? "");
  const [matchId, setMatchId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/team/disputes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: disputeType,
            title: title.trim(),
            description: description.trim(),
            tournamentId: tournamentId || undefined,
            matchId: matchId || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to submit dispute");
          return;
        }
        toast.success("Dispute submitted");
        setOpen(false);
        setTitle("");
        setDescription("");
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
          <Button size="sm" className="h-8">
            <ShieldAlert className="h-3.5 w-3.5" /> Raise Dispute
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> Raise a Dispute
          </DialogTitle>
          <DialogDescription>
            Report an issue to the organizer and admins. Be specific — include dates, teams, and what happened.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dtype">Type *</Label>
              <Select value={disputeType} onValueChange={setDisputeType}>
                <SelectTrigger id="dtype"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(DISPUTE_TYPES).map((t) => (
                    <SelectItem key={t} value={t}>{DISPUTE_TYPE_META[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dtitle">Title *</Label>
              <Input id="dtitle" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ddesc">Description *</Label>
              <Textarea id="ddesc" required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the issue in detail" />
            </div>
            {tournaments && tournaments.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="dtour">Tournament (optional)</Label>
                <Select value={tournamentId} onValueChange={setTournamentId}>
                  <SelectTrigger id="dtour"><SelectValue placeholder="Select tournament" /></SelectTrigger>
                  <SelectContent>
                    {tournaments.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {matches && matches.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="dmatch">Match (optional)</Label>
                <Select value={matchId} onValueChange={setMatchId}>
                  <SelectTrigger id="dmatch"><SelectValue placeholder="Select match" /></SelectTrigger>
                  <SelectContent>
                    {matches.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Submit Dispute
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Convenience alias used by other pages where most params are preset
export function LinkDisputeDialog({
  type,
  presetTournamentId,
  presetTitle,
  trigger,
}: {
  type?: string;
  presetTournamentId?: string;
  presetTitle?: string;
  trigger?: React.ReactNode;
}) {
  return (
    <RaiseDisputeDialog
      type={type}
      presetTournamentId={presetTournamentId}
      presetTitle={presetTitle}
      trigger={trigger}
    />
  );
}
