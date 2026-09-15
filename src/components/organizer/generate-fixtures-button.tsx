"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { FORMAT_META } from "@/lib/constants";

type Props = {
  tournamentId: string;
  tournamentName: string;
  format: string;
  approvedCount: number;
  disabled?: boolean;
  disabledReason?: string;
};

export function GenerateFixturesButton({
  tournamentId, tournamentName, format, approvedCount, disabled, disabledReason,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ matches: number } | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) setResult(null);
    setOpen(next);
  };

  const generate = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/organizer/tournaments/${tournamentId}/fixtures/generate`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to generate fixtures");
          return;
        }
        setResult({ matches: data.matches });
        toast.success(`Generated ${data.matches} match${data.matches === 1 ? "" : "es"} for ${tournamentName}`);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled} className="bg-emerald-600 hover:bg-emerald-700">
          <Sparkles className="h-4 w-4" />
          Generate Fixtures
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate fixtures for {tournamentName}
          </DialogTitle>
          <DialogDescription>
            This will create match fixtures based on the tournament format. Existing matches (if any) will not be deleted.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="rounded-lg border bg-emerald-500/5 p-4 text-center">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              ✅ {result.matches} match{result.matches === 1 ? "" : "es"} generated successfully
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Approved teams have been notified. Tournament status updated.</p>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Format</p>
                <p className="font-medium">{FORMAT_META[format]?.label ?? format}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{FORMAT_META[format]?.desc}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Approved teams</p>
                <p className="font-medium">{approvedCount}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Each will play per the format</p>
              </div>
            </div>
            {disabled && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="text-amber-700 dark:text-amber-400">{disabledReason || "Cannot generate fixtures at this time."}</span>
              </div>
            )}
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• {format === "ROUND_ROBIN" ? "Each team plays every other team once." : format === "GROUP_KNOCKOUT" ? "Teams split into groups of 4, then knockout rounds." : "Knockout bracket — lose once and you're out."}</li>
              <li>• All approved team managers will be notified.</li>
              <li>• Tournament status will move to <strong>Registration Closed</strong> (or stay Ongoing if already started).</li>
            </ul>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => setOpen(false)} className="bg-emerald-600 hover:bg-emerald-700">
              Done
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button type="button" onClick={generate} disabled={pending || disabled} className="bg-emerald-600 hover:bg-emerald-700">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Confirm &amp; Generate
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
