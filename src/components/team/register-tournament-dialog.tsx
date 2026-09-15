"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trophy, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHODS, PAYMENT_METHOD_META, type Sport } from "@/lib/constants";
import { taka } from "@/lib/helpers";

type Team = { id: string; name: string };
type Tournament = {
  id: string;
  name: string;
  sport: string;
  entryFee: number;
  maxTeams: number;
  _count: { registrations: number };
};

export function RegisterTournamentDialog({
  tournament,
  teams,
  trigger,
}: {
  tournament: Tournament;
  teams: Team[];
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [teamId, setTeamId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS.BKASH);

  const available = tournament._count.registrations < tournament.maxTeams;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) {
      toast.error("Select a team");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/team/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tournamentId: tournament.id, teamId, paymentMethod }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to register");
          return;
        }
        toast.success("Application submitted — pending organizer approval");
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
          <Button size="sm" className="h-8" disabled={!available || teams.length === 0}>
            <Trophy className="h-3.5 w-3.5" /> Register
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Register for Tournament
          </DialogTitle>
          <DialogDescription>
            {tournament.name} · Entry fee {taka(tournament.entryFee)}
          </DialogDescription>
        </DialogHeader>
        {teams.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            You need to create a team before registering. <a href="/team/teams" className="text-primary underline">Create team</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-team">Select Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger id="reg-team"><SelectValue placeholder="Choose one of your teams" /></SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-pay">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="reg-pay"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(PAYMENT_METHODS).map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_META[m]?.emoji} {PAYMENT_METHOD_META[m]?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> Entry fee: <strong>{taka(tournament.entryFee)}</strong> — payment status starts as PENDING.
              </p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p>After you submit:</p>
              <p className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Application goes to organizer as PENDING</p>
              <p className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Organizer approves → team becomes a participant</p>
              <p className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> You will be notified on each status change</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
