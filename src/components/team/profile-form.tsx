"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BANGLADESH_DIVISIONS } from "@/lib/constants";

type Profile = {
  id: string;
  phone?: string | null;
  district?: string | null;
  user: { id: string; name: string; email: string };
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(profile.user.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [district, setDistrict] = useState(profile.district ?? "Dhaka");

  const allDistricts = Object.values(BANGLADESH_DIVISIONS).flat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/team/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined, district }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to update profile");
          return;
        }
        toast.success("Profile updated");
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pname">Full Name *</Label>
          <Input id="pname" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pemail">Email (read-only)</Label>
          <Input id="pemail" value={profile.user.email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pphone">Phone</Label>
          <Input id="pphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pdis">District</Label>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger id="pdis"><SelectValue /></SelectTrigger>
            <SelectContent>
              {allDistricts.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
