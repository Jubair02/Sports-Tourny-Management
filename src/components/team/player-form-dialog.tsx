"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Save, User, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FOOTBALL_POSITIONS, CRICKET_POSITIONS } from "@/lib/constants";

export type PlayerFormValues = {
  name: string;
  photo?: string;
  dateOfBirth?: string; // yyyy-mm-dd
  phone?: string;
  jerseyNumber?: number;
  position?: string;
  nidReference?: string;
};

export function PlayerFormDialog({
  teamId,
  teamSport,
  mode = "create",
  player,
  trigger,
}: {
  teamId: string;
  teamSport: string;
  mode?: "create" | "edit";
  player?: {
    id: string;
    name: string;
    photo?: string | null;
    dateOfBirth?: Date | string | null;
    phone?: string | null;
    jerseyNumber?: number | null;
    position?: string | null;
    nidReference?: string | null;
  };
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isCricket = teamSport === "CRICKET";
  const positionOptions = isCricket ? CRICKET_POSITIONS : FOOTBALL_POSITIONS;

  const [name, setName] = useState(player?.name ?? "");
  const [photo, setPhoto] = useState(player?.photo ?? "");
  const [dob, setDob] = useState(() => {
    if (!player?.dateOfBirth) return "";
    const d = new Date(player.dateOfBirth);
    return d.toISOString().slice(0, 10);
  });
  const [phone, setPhone] = useState(player?.phone ?? "");
  const [jersey, setJersey] = useState(player?.jerseyNumber ? String(player.jerseyNumber) : "");
  const [position, setPosition] = useState(player?.position ?? "");
  const [nid, setNid] = useState(player?.nidReference ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Player name is required");
      return;
    }
    startTransition(async () => {
      try {
        const payload: PlayerFormValues = {
          name: name.trim(),
          photo: photo.trim() || undefined,
          dateOfBirth: dob || undefined,
          phone: phone.trim() || undefined,
          jerseyNumber: jersey ? Number(jersey) : undefined,
          position: position || undefined,
          nidReference: nid.trim() || undefined,
        };
        const url =
          mode === "create"
            ? `/api/team/players?teamId=${encodeURIComponent(teamId)}`
            : `/api/team/players/${player!.id}`;
        const method = mode === "create" ? "POST" : "PATCH";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to save player");
          return;
        }
        toast.success(mode === "create" ? "Player added" : "Player updated");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  const handleDelete = () => {
    if (!player) return;
    if (!confirm(`Remove ${player.name} from the team?`)) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/team/players/${player.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to remove player");
          return;
        }
        toast.success("Player removed");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant={mode === "edit" ? "outline" : "default"} className="h-8">
            {mode === "create" ? <Plus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {mode === "create" ? "Add Player" : "Edit"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {mode === "create" ? "Add Player" : "Edit Player"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a player to this team. They will start with PENDING verification."
              : "Update player details or remove from team."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pname">Full Name *</Label>
              <Input id="pname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Player full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pjersey">Jersey Number</Label>
              <Input id="pjersey" type="number" min="0" value={jersey} onChange={(e) => setJersey(e.target.value)} placeholder="e.g. 10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ppos">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger id="ppos"><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>
                  {positionOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdob">Date of Birth</Label>
              <Input id="pdob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pphone">Phone</Label>
              <Input id="pphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pnid">NID / Birth Certificate Reference</Label>
              <Input id="pnid" value={nid} onChange={(e) => setNid(e.target.value)} placeholder="Used for verification (never shown publicly)" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pphoto">Photo URL (optional)</Label>
              <Input id="pphoto" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {mode === "edit" && (
              <Button type="button" variant="outline" className="mr-auto text-destructive hover:bg-destructive/5" onClick={handleDelete} disabled={pending}>
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === "create" ? "Add Player" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
