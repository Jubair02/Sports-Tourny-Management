"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Loader2, Eye, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { DISPUTE_TYPE_META, DISPUTE_STATUS_META } from "@/lib/constants";
import { formatDateTime } from "@/lib/helpers";

type Dispute = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  raisedBy: { id: string; name: string; email: string; role: string } | null;
  tournament: { id: string; name: string } | null;
  match: { id: string; matchCode: string | null; homeTeam: { name: string } | null; awayTeam: { name: string } | null } | null;
};

function ActionButton({
  label,
  targetStatus,
  disputeId,
  variant,
  className,
  icon: Icon,
}: {
  label: string;
  targetStatus: string;
  disputeId: string;
  variant: "default" | "outline";
  className?: string;
  icon: typeof Eye;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [resolution, setResolution] = useState("");

  const submit = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/disputes/${disputeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus, resolution: resolution.trim() || undefined }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed");
          return;
        }
        toast.success(`Dispute marked ${DISPUTE_STATUS_META[targetStatus]?.label ?? targetStatus}`);
        setOpen(false);
        setResolution("");
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variant} className={`h-8 ${className ?? ""}`}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label} — Dispute</DialogTitle>
          <DialogDescription>
            Set the dispute status to <strong>{DISPUTE_STATUS_META[targetStatus]?.label ?? targetStatus}</strong>.{targetStatus === "RESOLVED" || targetStatus === "REJECTED" ? " Add a resolution note for the record." : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="res">Resolution note</Label>
          <Textarea
            id="res"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Briefly explain the decision…"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DisputeRow({ dispute, expanded, onToggle }: { dispute: Dispute; expanded: boolean; onToggle: () => void }) {
  const statusMeta = DISPUTE_STATUS_META[dispute.status] ?? { label: dispute.status, color: "secondary" };
  const typeLabel = DISPUTE_TYPE_META[dispute.type] ?? dispute.type;
  const isClosed = dispute.status === "RESOLVED" || dispute.status === "REJECTED";

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={typeLabel} color="secondary" />
            <StatusBadge label={statusMeta.label} color={statusMeta.color} dot />
            <span className="text-xs text-muted-foreground">{formatDateTime(dispute.createdAt)}</span>
          </div>
          <p className="mt-1 truncate text-sm font-medium">{dispute.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            by {dispute.raisedBy?.name ?? "Unknown"}
            {dispute.tournament ? ` · ${dispute.tournament.name}` : ""}
            {dispute.match ? ` · ${dispute.match.homeTeam?.name ?? "?"} vs ${dispute.match.awayTeam?.name ?? "?"}` : ""}
          </p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t bg-muted/30 p-3 space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="text-sm whitespace-pre-wrap">{dispute.description}</p>
          </div>
          {dispute.resolution && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resolution</p>
              <p className="text-sm whitespace-pre-wrap">{dispute.resolution}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!isClosed && (
              <>
                {dispute.status === "OPEN" && (
                  <ActionButton label="Under Review" targetStatus="UNDER_REVIEW" disputeId={dispute.id} variant="outline" icon={Eye} />
                )}
                <ActionButton label="Resolve" targetStatus="RESOLVED" disputeId={dispute.id} variant="default" className="bg-emerald-600 hover:bg-emerald-700" icon={Check} />
                <ActionButton label="Reject" targetStatus="REJECTED" disputeId={dispute.id} variant="outline" className="text-destructive hover:bg-destructive/5" icon={X} />
              </>
            )}
            {isClosed && (
              <span className="text-xs text-muted-foreground">This dispute is closed.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
