"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, Play, CheckCircle2, XCircle, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOURNAMENT_STATUS, TOURNAMENT_STATUS_META } from "@/lib/constants";

type Props = {
  tournamentId: string;
  tournamentName: string;
  currentStatus: string;
  isAdmin?: boolean;
};

// Allowed organizer-driven next transitions from current status
const NEXT: Record<string, { status: string; label: string; variant: "default" | "outline"; destructive?: boolean }[]> = {
  DRAFT: [{ status: TOURNAMENT_STATUS.PENDING_APPROVAL, label: "Submit for Approval", variant: "default" }],
  PENDING_APPROVAL: [{ status: TOURNAMENT_STATUS.DRAFT, label: "Withdraw & Edit", variant: "outline" }],
  PUBLISHED: [
    { status: TOURNAMENT_STATUS.REGISTRATION_OPEN, label: "Open Registration", variant: "default" },
    { status: TOURNAMENT_STATUS.CANCELLED, label: "Cancel Tournament", variant: "outline", destructive: true },
  ],
  REGISTRATION_OPEN: [
    { status: TOURNAMENT_STATUS.REGISTRATION_CLOSED, label: "Close Registration", variant: "outline" },
    { status: TOURNAMENT_STATUS.CANCELLED, label: "Cancel Tournament", variant: "outline", destructive: true },
  ],
  REGISTRATION_CLOSED: [
    { status: TOURNAMENT_STATUS.ONGOING, label: "Start Tournament", variant: "default" },
    { status: TOURNAMENT_STATUS.CANCELLED, label: "Cancel Tournament", variant: "outline", destructive: true },
  ],
  ONGOING: [
    { status: TOURNAMENT_STATUS.COMPLETED, label: "Complete Tournament", variant: "default" },
    { status: TOURNAMENT_STATUS.CANCELLED, label: "Cancel Tournament", variant: "outline", destructive: true },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

const ICONS: Record<string, typeof Send> = {
  [TOURNAMENT_STATUS.PENDING_APPROVAL]: Send,
  [TOURNAMENT_STATUS.DRAFT]: Unlock,
  [TOURNAMENT_STATUS.REGISTRATION_OPEN]: Unlock,
  [TOURNAMENT_STATUS.REGISTRATION_CLOSED]: Lock,
  [TOURNAMENT_STATUS.ONGOING]: Play,
  [TOURNAMENT_STATUS.COMPLETED]: CheckCircle2,
  [TOURNAMENT_STATUS.CANCELLED]: XCircle,
};

export function StatusWorkflowActions({ tournamentId, tournamentName, currentStatus, isAdmin }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const transitions = NEXT[currentStatus] ?? [];
  // ADMIN override: allow any forward transition
  const adminTransitions = isAdmin && currentStatus !== TOURNAMENT_STATUS.COMPLETED && currentStatus !== TOURNAMENT_STATUS.CANCELLED
    ? Object.values(TOURNAMENT_STATUS).filter((s) => s !== currentStatus)
    : [];

  const setStatus = (status: string) => {
    if (status === TOURNAMENT_STATUS.CANCELLED || status === TOURNAMENT_STATUS.COMPLETED) {
      const ok = window.confirm(`Are you sure you want to mark "${tournamentName}" as ${TOURNAMENT_STATUS_META[status]?.label}?`);
      if (!ok) return;
    }
    setBusy(status);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/organizer/tournaments/${tournamentId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to update status");
          return;
        }
        toast.success(data.message || `"${tournamentName}" → ${TOURNAMENT_STATUS_META[status]?.label ?? status}`);
        router.refresh();
      } catch {
        toast.error("Network error");
      } finally {
        setBusy(null);
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.length === 0 && (currentStatus === TOURNAMENT_STATUS.COMPLETED || currentStatus === TOURNAMENT_STATUS.CANCELLED) ? (
        <span className="text-xs text-muted-foreground">
          {currentStatus === TOURNAMENT_STATUS.COMPLETED ? "This tournament is complete." : "This tournament was cancelled."}
        </span>
      ) : null}
      {transitions.map((t) => {
        const Icon = ICONS[t.status] ?? Send;
        return (
          <Button
            key={t.status}
            size="sm"
            variant={t.variant}
            disabled={pending}
            onClick={() => setStatus(t.status)}
            className={
              t.status === TOURNAMENT_STATUS.PENDING_APPROVAL || t.status === TOURNAMENT_STATUS.ONGOING
                ? "bg-emerald-600 hover:bg-emerald-700"
                : t.destructive
                ? "text-destructive hover:bg-destructive/5"
                : ""
            }
          >
            {busy === t.status ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
            {t.label}
          </Button>
        );
      })}
      {isAdmin && adminTransitions.length > 0 && (
        <details className="w-full">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:underline">Admin override →</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {adminTransitions.map((s) => (
              <Button key={s} size="sm" variant="outline" disabled={pending} onClick={() => setStatus(s)}>
                {busy === s ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {TOURNAMENT_STATUS_META[s]?.label ?? s}
              </Button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
