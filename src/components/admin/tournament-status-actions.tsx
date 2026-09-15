"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOURNAMENT_STATUS, TOURNAMENT_STATUS_META } from "@/lib/constants";

const ACTIONS: { label: string; status: string; variant: "default" | "outline"; className?: string; icon: typeof Check }[] = [
  { label: "Publish", status: TOURNAMENT_STATUS.PUBLISHED, variant: "default", icon: Check, className: "bg-emerald-600 hover:bg-emerald-700" },
  { label: "Open Reg", status: TOURNAMENT_STATUS.REGISTRATION_OPEN, variant: "default", icon: Check },
  { label: "Reject", status: TOURNAMENT_STATUS.CANCELLED, variant: "outline", icon: X, className: "text-destructive hover:bg-destructive/5" },
];

export function TournamentStatusActions({
  tournamentId,
  tournamentName,
  currentStatus,
  minimal = false,
}: {
  tournamentId: string;
  tournamentName: string;
  currentStatus: string;
  minimal?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const setStatus = (status: string) => {
    setBusy(status);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/tournaments/${tournamentId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed");
          return;
        }
        toast.success(`"${tournamentName}" → ${TOURNAMENT_STATUS_META[status]?.label ?? status}`);
        router.refresh();
      } catch {
        toast.error("Network error");
      } finally {
        setBusy(null);
      }
    });
  };

  if (minimal) {
    return (
      <Button
        size="sm"
        variant="default"
        className="h-8 bg-emerald-600 hover:bg-emerald-700"
        disabled={pending}
        onClick={() => setStatus(TOURNAMENT_STATUS.PUBLISHED)}
      >
        {busy === TOURNAMENT_STATUS.PUBLISHED ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Publish
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {ACTIONS.map((a) => (
        <Button
          key={a.label}
          size="sm"
          variant={a.variant}
          className={`h-8 ${a.className ?? ""}`}
          disabled={pending}
          onClick={() => setStatus(a.status)}
        >
          {busy === a.status ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <a.icon className="h-3.5 w-3.5" />}
          {a.label}
        </Button>
      ))}
    </div>
  );
}
