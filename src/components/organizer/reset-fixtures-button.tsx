"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ResetFixturesButton({
  tournamentId,
  tournamentName,
  matchCount,
}: {
  tournamentId: string;
  tournamentName: string;
  matchCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/organizer/tournaments/${tournamentId}/fixtures/generate`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to reset fixtures");
          return;
        }
        toast.success(`Deleted ${data.deleted} fixture(s). You can regenerate now.`);
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:bg-destructive/5"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Reset Fixtures
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reset all fixtures?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                This deletes all <strong>{matchCount}</strong> match(es) for{" "}
                <span className="font-medium text-foreground">{tournamentName}</span>, along with
                their submitted results, events, and referee assignments, and clears the standings.
              </p>
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                This cannot be undone. The tournament returns to Registration Closed so you can
                regenerate fixtures.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete all fixtures
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
