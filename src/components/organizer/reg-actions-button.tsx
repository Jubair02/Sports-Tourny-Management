"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2, Eye, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REG_STATUS_META } from "@/lib/constants";
import Link from "next/link";

type Props = {
  tournamentId: string;
  regId: string;
  teamName: string;
  currentStatus: string;
  compact?: boolean;
};

export function RegActionsButton({ tournamentId, regId, teamName, currentStatus, compact }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (status: "APPROVED" | "REJECTED" | "UNDER_REVIEW", reason?: string) => {
    setBusy(status);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/organizer/tournaments/${tournamentId}/registrations/${regId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reason }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed");
          return;
        }
        toast.success(`${teamName}: ${REG_STATUS_META[status]?.label ?? status}`);
        router.refresh();
      } catch {
        toast.error("Network error");
      } finally {
        setBusy(null);
      }
    });
  };

  if (compact) {
    return (
      <Button
        size="sm"
        className="h-8 bg-emerald-600 hover:bg-emerald-700"
        disabled={pending || currentStatus === "APPROVED"}
        onClick={() => act("APPROVED")}
      >
        {busy === "APPROVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Approve
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button asChild variant="ghost" size="sm" className="h-8">
        <Link href={`/organizer/tournaments/${tournamentId}/registrations`}>
          <Eye className="h-3.5 w-3.5" />
          View
        </Link>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8"
        disabled={pending || currentStatus === "UNDER_REVIEW"}
        onClick={() => act("UNDER_REVIEW")}
        title="Mark as under review"
      >
        {busy === "UNDER_REVIEW" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
        Review
      </Button>
      <Button
        size="sm"
        className="h-8 bg-emerald-600 hover:bg-emerald-700"
        disabled={pending || currentStatus === "APPROVED"}
        onClick={() => act("APPROVED")}
      >
        {busy === "APPROVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-destructive hover:bg-destructive/5"
        disabled={pending || currentStatus === "REJECTED"}
        onClick={() => {
          const reason = window.prompt(`Reason for rejecting "${teamName}" (optional):`);
          act("REJECTED", reason ?? undefined);
        }}
      >
        {busy === "REJECTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Reject
      </Button>
    </div>
  );
}
