"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Save, Users, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BANGLADESH_DIVISIONS } from "@/lib/constants";

type Team = {
  id: string;
  name: string;
  logo?: string | null;
  captain?: string | null;
  phone?: string | null;
  email?: string | null;
  district?: string | null;
  address?: string | null;
  description?: string | null;
};

export function TeamFormDialog({
  mode = "create",
  team,
  trigger,
}: {
  mode?: "create" | "edit";
  team?: Team;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(team?.name ?? "");
  const [logo, setLogo] = useState(team?.logo ?? "");
  const [captain, setCaptain] = useState(team?.captain ?? "");
  const [phone, setPhone] = useState(team?.phone ?? "");
  const [email, setEmail] = useState(team?.email ?? "");
  const [district, setDistrict] = useState(team?.district ?? "Dhaka");
  const [address, setAddress] = useState(team?.address ?? "");
  const [description, setDescription] = useState(team?.description ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Team name is required");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          name: name.trim(),
          logo: logo.trim() || undefined,
          captain: captain.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          district,
          address: address.trim() || undefined,
          description: description.trim() || undefined,
        };
        const url = mode === "create" ? "/api/team/teams" : `/api/team/teams/${team!.id}`;
        const method = mode === "create" ? "POST" : "PATCH";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to save team");
          return;
        }
        toast.success(mode === "create" ? "Team created" : "Team updated");
        setOpen(false);
        if (mode === "create" && data.team?.id) {
          router.push(`/team/teams/${data.team.id}`);
        } else {
          router.refresh();
        }
      } catch {
        toast.error("Network error");
      }
    });
  };

  const districts = BANGLADESH_DIVISIONS[district] ? [] : Object.values(BANGLADESH_DIVISIONS).flat();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="h-8">
            {mode === "create" ? <Plus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {mode === "create" ? "Create Team" : "Edit Team"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {mode === "create" ? "Create New Team" : "Edit Team"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Register a new team. You can add players once the team is created."
              : "Update your team information."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tname">Team Name *</Label>
              <Input id="tname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dhaka Warriors" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tcap">Captain</Label>
              <Input id="tcap" value={captain} onChange={(e) => setCaptain(e.target.value)} placeholder="Captain name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tphone">Phone</Label>
              <Input id="tphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temail">Email</Label>
              <Input id="temail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tdis">District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger id="tdis"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="taddr">Address</Label>
              <Input id="taddr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tlogo">Logo URL (optional)</Label>
              <Input id="tlogo" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tdesc">Description</Label>
              <Textarea id="tdesc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Short team description" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === "create" ? "Create Team" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
