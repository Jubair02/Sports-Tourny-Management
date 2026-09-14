"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Pause, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserActions({
  userId,
  currentStatus,
  organizerProfileId,
  isPendingOrganizer,
}: {
  userId: string;
  currentStatus: string;
  organizerProfileId?: string;
  isPendingOrganizer?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const setStatus = (status: "ACTIVE" | "SUSPENDED") => {
    setBusy(status);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to update");
          return;
        }
        toast.success(`User ${status === "ACTIVE" ? "reactivated" : "suspended"}`);
        router.refresh();
      } catch {
        toast.error("Network error");
      } finally {
        setBusy(null);
      }
    });
  };

  const approveOrganizer = (action: "approve" | "reject") => {
    if (!organizerProfileId) return;
    setBusy(action);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/organizers/${organizerProfileId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed");
          return;
        }
        toast.success(`Organizer ${action === "approve" ? "approved" : "rejected"}`);
        router.refresh();
      } catch {
        toast.error("Network error");
      } finally {
        setBusy(null);
      }
    });
  };

  if (isPendingOrganizer && organizerProfileId) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-8 bg-emerald-600 hover:bg-emerald-700"
          disabled={pending}
          onClick={() => approveOrganizer("approve")}
        >
          {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-destructive hover:bg-destructive/5"
          disabled={pending}
          onClick={() => approveOrganizer("reject")}
        >
          {busy === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Reject
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant={currentStatus === "ACTIVE" ? "outline" : "default"}
      className="h-8"
      disabled={pending}
      onClick={() => setStatus(currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : currentStatus === "ACTIVE" ? (
        <Pause className="h-3.5 w-3.5" />
      ) : (
        <Play className="h-3.5 w-3.5" />
      )}
      {currentStatus === "ACTIVE" ? "Suspend" : "Activate"}
    </Button>
  );
}
