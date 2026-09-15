"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Pencil, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BANGLADESH_DIVISIONS, ROLES } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/nav";

const ASSIGNABLE_ROLES = [ROLES.ORGANIZER, ROLES.TEAM_MANAGER, ROLES.REFEREE, ROLES.ADMIN];

const ALL_DISTRICTS = Object.values(BANGLADESH_DIVISIONS).flat().sort();

export function UserFormDialog({
  mode = "create",
  user,
  trigger,
}: {
  mode?: "create" | "edit";
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
  };
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState(user?.role ?? ROLES.TEAM_MANAGER);
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState("");
  const [organization, setOrganization] = useState("");

  const isCreate = mode === "create";

  // Reset back to the row's values whenever the dialog is reopened.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setPhone(user?.phone ?? "");
      setRole(user?.role ?? ROLES.TEAM_MANAGER);
      setPassword("");
      setDistrict("");
      setOrganization("");
      setShowPassword(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload: Record<string, unknown> = {
          name,
          email,
          phone: phone || "",
          role,
        };
        if (isCreate) {
          payload.password = password;
          if (district) payload.district = district;
          if (organization) payload.organization = organization;
        } else if (password) {
          // Optional on edit — only sent when the admin typed a new one.
          payload.password = password;
        }

        const res = await fetch(
          isCreate ? "/api/admin/users" : `/api/admin/users/${user!.id}`,
          {
            method: isCreate ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to save user");
          return;
        }
        toast.success(isCreate ? `${name} created` : "User updated");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={isCreate ? "default" : "outline"} size="sm" className="h-8">
            {isCreate ? <UserPlus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {isCreate ? "Create User" : "Edit"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCreate ? <UserPlus className="h-5 w-5 text-primary" /> : <Pencil className="h-5 w-5 text-primary" />}
            {isCreate ? "Create New User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Create an account directly. The user can sign in immediately with this password."
              : "Update account details. Leave the password blank to keep the current one."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uname">Full name *</Label>
            <Input
              id="uname"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arif Hossain"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="uemail">Email *</Label>
              <Input
                id="uemail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uphone">Phone</Label>
              <Input
                id="uphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801…"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urole">Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="urole"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCreate && (role === ROLES.ORGANIZER || role === ROLES.TEAM_MANAGER || role === ROLES.REFEREE) && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="udistrict">District</Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger id="udistrict">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {role === ROLES.ORGANIZER && (
                <div className="space-y-2">
                  <Label htmlFor="uorg">Organization</Label>
                  <Input
                    id="uorg"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Mirpur Sports Association"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="upass">
              {isCreate ? "Password *" : "New password"}
            </Label>
            <div className="relative">
              <Input
                id="upass"
                type={showPassword ? "text" : "password"}
                required={isCreate}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isCreate ? "At least 6 characters" : "Leave blank to keep current"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isCreate ? "Create User" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
