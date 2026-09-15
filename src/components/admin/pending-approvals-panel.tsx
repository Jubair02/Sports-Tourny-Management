"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, relativeTime } from "@/lib/helpers";

type PendingItem = {
  kind: "ORGANIZER" | "TOURNAMENT";
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  createdAt: string;
};

export function PendingApprovalsPanel({ items }: { items: PendingItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = (item: PendingItem, action: "approve" | "reject") => {
    setBusyId(item.id);
    startTransition(async () => {
      try {
        let res: Response;
        if (item.kind === "ORGANIZER") {
          res = await fetch(`/api/admin/organizers/${item.id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });
        } else {
          const status = action === "approve" ? "PUBLISHED" : "REJECTED";
          res = await fetch(`/api/admin/tournaments/${item.id}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
        }
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || `Failed to ${action} ${item.kind.toLowerCase()}`);
          return;
        }
        toast.success(
          `${item.kind === "ORGANIZER" ? "Organizer" : "Tournament"} ${action === "approve" ? "approved" : "rejected"}`
        );
        router.refresh();
      } catch {
        toast.error("Network error");
      } finally {
        setBusyId(null);
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Check className="mb-2 h-8 w-8 text-emerald-500" />
        <p className="font-medium">All caught up!</p>
        <p className="text-sm text-muted-foreground">No pending approvals right now.</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 space-y-2 overflow-y-auto scrollbar-thin pr-1">
      {items.map((item) => (
        <div
          key={`${item.kind}-${item.id}`}
          className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={item.kind === "ORGANIZER" ? "Organizer Application" : "Tournament Approval"}
                color="amber"
                dot
              />
              <span className="text-xs text-muted-foreground">{relativeTime(item.createdAt)}</span>
            </div>
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
            <p className="text-[11px] text-muted-foreground">{item.meta}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="default"
              className="h-8 bg-emerald-600 hover:bg-emerald-700"
              disabled={pending && busyId === item.id}
              onClick={() => act(item, "approve")}
            >
              {pending && busyId === item.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-destructive hover:bg-destructive/5"
              disabled={pending && busyId === item.id}
              onClick={() => act(item, "reject")}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
