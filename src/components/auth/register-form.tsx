"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Trophy, Users, Flag, Building2, Info } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BANGLADESH_DIVISIONS } from "@/lib/constants";

// Referee accounts are created by an admin (referees are vetted, not self-service).
const ROLE_OPTIONS = [
  { value: "TEAM_MANAGER", label: "Team Manager", desc: "Create & manage teams, register for tournaments", icon: Flag },
  { value: "ORGANIZER", label: "Organizer", desc: "Create & run tournaments (requires approval)", icon: Building2 },
];

const DASHBOARDS: Record<string, string> = {
  TEAM_MANAGER: "/team",
  REFEREE: "/referee",
  ORGANIZER: "/organizer",
  ADMIN: "/admin",
};

export function RegisterForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    district: "",
    role: "TEAM_MANAGER",
    organization: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [pending, startTransition] = useTransition();

  const districts = Object.entries(BANGLADESH_DIVISIONS).flatMap(([div, ds]) =>
    ds.map((d) => ({ value: d, label: `${d} (${div})` }))
  );

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    startTransition(async () => {
      try {
        const payload: Record<string, string> = {
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          district: form.district,
          role: form.role,
        };
        if (form.role === "ORGANIZER") payload.organization = form.organization;
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Registration failed");
          return;
        }
        if (form.role === "ORGANIZER") {
          toast.success("Account created! Your organizer application is pending admin approval.");
        } else {
          toast.success(`Welcome aboard, ${data.user.name}!`);
        }
        const dest = next || DASHBOARDS[data.user.role] || "/";
        // Hard navigation guarantees the fresh session cookie is sent and
        // the dashboard server components re-render from scratch.
        window.location.href = dest;
      } catch {
        toast.error("Something went wrong. Try again.");
      }
    });
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.4) 0%, transparent 50%)" }} />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-lg tracking-tight">TourneyBD</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Run your <span className="text-emerald-300">tournament</span> the right way.
          </h1>
          <p className="text-amber-50/90 text-lg">
            Join thousands of organizers, team managers, and referees across Bangladesh building the country&apos;s biggest sports community.
          </p>
          <div className="grid gap-3 pt-2">
            {[
              { icon: Flag, title: "For Team Managers", desc: "Build your squad, register for tournaments, track player stats." },
              { icon: Building2, title: "For Organizers", desc: "Create tournaments, generate fixtures, manage registrations & standings." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 rounded-lg bg-white/10 p-3 backdrop-blur">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/15">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-amber-50/80">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-sm text-amber-100/70">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-white underline">
            Sign in
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:hidden">
            <Logo className="justify-center" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
            <p className="text-sm text-muted-foreground">Pick a role and join TourneyBD in seconds.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Md. Karim Uddin" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="you@example.com" className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="01XXXXXXXXX" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select value={form.district} onValueChange={(v) => setField("district", v)}>
                  <SelectTrigger id="district" className="h-10">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>I want to register as</Label>
              <div className="grid gap-2">
                {ROLE_OPTIONS.map((opt) => {
                  const active = form.role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setField("role", opt.value)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        active ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        <opt.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.role === "ORGANIZER" && (
              <div className="space-y-2">
                <Label htmlFor="organization">Organization / Club name</Label>
                <Input
                  id="organization"
                  required
                  value={form.organization}
                  onChange={(e) => setField("organization", e.target.value)}
                  placeholder="e.g. Mirpur Sports Club"
                  className="h-10"
                />
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  New organizers require admin approval before they can publish tournaments.
                </p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create account
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
