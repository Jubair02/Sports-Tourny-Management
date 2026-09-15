"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Pause, Play, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserFormDialog } from "@/components/admin/user-form-dialog";

export function UserActions({
  userId,
  userName,
  userEmail,
  userPhone,
  userRole,
  currentStatus,
  organizerProfileId,
  isPendingOrganizer,
  isSelf,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  userRole: string;
  currentStatus: string;
  organizerProfileId?: string;
  isPendingOrganizer?: boolean;
  isSelf?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

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
        setConfirmSuspend(false);
        // Suspending yourself invalidates your own session — send it to login.
        if (status === "SUSPENDED" && isSelf) {
          router.push("/login");
          return;
        }
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
      <div className="flex items-center justify-end gap-2">
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

  const isActive = currentStatus === "ACTIVE";

  return (
    <div className="flex items-center justify-end gap-2">
      <UserFormDialog
        mode="edit"
        user={{ id: userId, name: userName, email: userEmail, phone: userPhone, role: userRole }}
      />

      {isActive ? (
        <>
          {/* Suspending cuts off access, so it goes through a confirmation step. */}
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={pending}
            onClick={() => setConfirmSuspend(true)}
          >
            {busy === "SUSPENDED" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
            Suspend
          </Button>

          <AlertDialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Suspend {userName}?
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium text-foreground">{userEmail}</span> will be signed
                      out and blocked from logging in until an admin reactivates the account.
                    </p>
                    {isSelf && (
                      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                        This is your own account. You will be logged out immediately and will need
                        another admin — or direct database access — to get back in.
                      </p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={(e) => {
                    e.preventDefault(); // keep the dialog open while the request is in flight
                    setStatus("SUSPENDED");
                  }}
                >
                  {busy === "SUSPENDED" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  Suspend account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <Button size="sm" className="h-8" disabled={pending} onClick={() => setStatus("ACTIVE")}>
          {busy === "ACTIVE" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Activate
        </Button>
      )}
    </div>
  );
}
