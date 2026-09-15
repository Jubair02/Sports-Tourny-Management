"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Trophy, Users, Hand, Flag, ChevronRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DASHBOARDS: Record<string, string> = {
  ADMIN: "/admin",
  ORGANIZER: "/organizer",
  TEAM_MANAGER: "/team",
  REFEREE: "/referee",
};

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@tourney.bd", password: "admin123", icon: Trophy, color: "bg-primary/10 text-primary" },
  { role: "Organizer", email: "jubair@mirpursports.bd", password: "organ123", icon: Users, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { role: "Team Manager", email: "rahim@dhakawarriors.bd", password: "manage123", icon: Flag, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  { role: "Referee", email: "ref.rahman@tourney.bd", password: "refer123", icon: Hand, color: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
];

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const reason = searchParams.get("reason");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Login failed");
          return;
        }
        toast.success(`Welcome back, ${data.user.name}!`);
        const dest = next || DASHBOARDS[data.user.role] || "/";
        // Hard navigation guarantees the fresh session cookie is sent and
        // the dashboard server components re-render from scratch.
        // (router.push + router.refresh inside a transition can silently no-op.)
        window.location.href = dest;
      } catch {
        toast.error("Something went wrong. Try again.");
      }
    });
  };

  const fillDemo = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
    setShowDemo(false);
    toast.info("Demo credentials filled — press Sign in");
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(251,191,36,0.3) 0%, transparent 50%)" }} />
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
            Bangladesh&apos;s home for <span className="text-amber-300">sports tournaments</span>.
          </h1>
          <p className="text-emerald-50/90 text-lg">
            Organize football, cricket, futsal &amp; more. Manage teams, fixtures, results and rankings — all in one place.
          </p>
          <ul className="space-y-3 pt-2">
            {[
              "Multi-sport fixture generation (round robin, knockout, groups)",
              "Live standings, results & player stats",
              "Built-in payments (bKash, Nagad, Rocket) & dispute resolution",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 text-emerald-50/90">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 text-sm text-emerald-100/70">
          Trusted by clubs, schools &amp; communities across all 8 divisions.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:hidden">
            <Logo className="justify-center" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="text-sm text-muted-foreground">
              Welcome back. Enter your credentials to access your dashboard.
            </p>
          </div>

          {reason === "forbidden" && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              You don&apos;t have permission to view that page. Please sign in with the correct account.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-muted-foreground hover:text-primary">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          <div className="rounded-lg border bg-muted/30 p-3">
            <button
              type="button"
              onClick={() => setShowDemo((s) => !s)}
              className="flex w-full items-center justify-between text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Show demo accounts
              </span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showDemo ? "rotate-90" : ""}`} />
            </button>
            {showDemo && (
              <div className="mt-3 grid gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc.email, acc.password)}
                    className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md ${acc.color}`}>
                      <acc.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{acc.role}</p>
                      <p className="truncate text-xs text-muted-foreground">{acc.email}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{acc.password}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
