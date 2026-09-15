"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { RESULT_STATUS, RESULT_STATUS_META } from "@/lib/constants";

type Props = {
  tournamentId: string;
  matchId: string;
  matchCode?: string | null;
  homeTeamName?: string;
  awayTeamName?: string;
  resultStatus: string;
  variant?: "default" | "compact";
};

export function ResultActionsButton({
  tournamentId, matchId, matchCode, homeTeamName, awayTeamName, resultStatus,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<null | "APPROVE" | "REJECT">(null);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  const canReview = resultStatus === RESULT_STATUS.SUBMITTED;

  const submit = () => {
    if (!open) return;
    const action = open;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/organizer/tournaments/${tournamentId}/matches/${matchId}/result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, note: note.trim() || undefined }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed");
          return;
        }
        toast.success(
          action === "APPROVE"
            ? "Result approved. Standings updated."
            : "Result rejected. Referee notified to re-submit."
        );
        setOpen(null);
        setNote("");
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          className="h-8 bg-emerald-600 hover:bg-emerald-700"
          disabled={!canReview}
          onClick={() => setOpen("APPROVE")}
          title={canReview ? "Approve result" : `Cannot approve (status: ${resultStatus})`}
        >
          <Check className="h-3.5 w-3.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-destructive hover:bg-destructive/5"
          disabled={!canReview}
          onClick={() => setOpen("REJECT")}
          title={canReview ? "Reject result" : `Cannot reject (status: ${resultStatus})`}
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </Button>
      </div>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {open === "APPROVE" ? "Approve Result" : "Reject Result"}
            </DialogTitle>
            <DialogDescription>
              Match {matchCode ?? ""} — {homeTeamName ?? "?"} vs {awayTeamName ?? "?"}
              <br />
              Current result status: {RESULT_STATUS_META[resultStatus]?.label ?? resultStatus}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ra-note">
              {open === "APPROVE" ? "Approval note (optional)" : "Rejection reason (optional)"}
            </Label>
            <Textarea
              id="ra-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={open === "APPROVE" ? "e.g. Verified against events log" : "e.g. Score mismatch — please re-check and re-submit"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)} disabled={pending}>Cancel</Button>
            <Button
              onClick={submit}
              disabled={pending}
              className={open === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "text-destructive hover:bg-destructive/5"}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : open === "APPROVE" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {open === "APPROVE" ? "Approve Result" : "Reject Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
