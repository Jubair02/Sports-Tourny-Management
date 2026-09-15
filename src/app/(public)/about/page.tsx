import Link from "next/link";
import {
  Trophy, Users, CalendarDays, MapPin, ShieldCheck, Megaphone, BarChart3,
  Building2, Sparkles, Target, Globe2, Cpu, UserCheck, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-elements";
import { SPORTS_LIST, SPORT_META, BANGLADESH_DIVISIONS } from "@/lib/constants";

const ROLES = [
  {
    icon: Megaphone,
    title: "Organizers",
    color: "from-emerald-500 to-teal-600",
    desc: "Create tournaments, set entry fees, approve team registrations, generate fixtures, and publish approved results — all from a dedicated dashboard.",
    href: "/register",
    cta: "Become an Organizer",
  },
  {
    icon: ShieldCheck,
    title: "Team Managers",
    color: "from-amber-500 to-orange-600",
    desc: "Register your squad, verify player identities, manage rosters across multiple tournaments, and track your team's standings in real time.",
    href: "/register",
    cta: "Register a Team",
  },
  {
    icon: UserCheck,
    title: "Referees",
    color: "from-violet-500 to-fuchsia-600",
    desc: "Receive match assignments, submit live scores and player-of-the-match awards, and build a track record on the platform.",
    href: "/register",
    cta: "Become a Referee",
  },
  {
    icon: Users,
    title: "Fans",
    color: "from-cyan-500 to-sky-600",
    desc: "Follow live scores, browse upcoming fixtures, check standings and rankings, and discover rising stars from your district.",
    href: "/tournaments",
    cta: "Explore Tournaments",
  },
];

const FEATURES = [
  { icon: CalendarDays, title: "Fixtures & Scheduling", desc: "Auto-generate round-robin, single-elimination, or group + knockout brackets with venue and referee assignments." },
  { icon: BarChart3, title: "Live Standings", desc: "Standings recompute automatically from approved match results — points, goal difference, head-to-head." },
  { icon: ShieldCheck, title: "Player Verification", desc: "NID-backed verification with admin review keeps identity fraud out of your tournaments." },
  { icon: Megaphone, title: "Announcements", desc: "Pin important updates to tournament pages so players and fans always stay in the loop." },
  { icon: Trophy, title: "Rankings & Medals", desc: "Cross-tournament aggregate rankings with podium highlights for the top three teams." },
  { icon: Building2, title: "Venue Management", desc: "Catalog venues by division, district and upazila — capacity, facilities, and the full Bangladesh geographic tree." },
  { icon: Cpu, title: "Mobile-first", desc: "Designed for the way Bangladeshis actually browse — fast on low-end Android, accessible on small screens." },
  { icon: Sparkles, title: "Local payments", desc: "bKash, Nagad, Rocket, and cash tracking built-in for entry-fee collection." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="About TourneyBD"
        description="Bangladesh's all-in-one sports tournament management platform — built locally for grassroots, community, corporate, and competitive events."
      />

      {/* HERO */}
      <Card className="mt-6 overflow-hidden p-0 py-0">
        <div className="relative aspect-[21/9] sm:aspect-[3/1] w-full overflow-hidden bg-emerald-900">
          <img
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&q=70&auto=format&fit=crop"
            alt="Bangladesh sports"
            className="h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/95 via-emerald-900/80 to-emerald-700/40" />
          <div className="absolute inset-0 flex flex-col items-start justify-center gap-4 p-6 text-white sm:p-12">
            <Badge className="bg-amber-500/20 text-amber-200 ring-1 ring-amber-300/30">
              <Target className="h-3.5 w-3.5" /> Our mission
            </Badge>
            <h2 className="max-w-3xl text-balance text-2xl font-extrabold tracking-tight sm:text-4xl">
              To give every Bangladeshi athlete a stage to compete on.
            </h2>
            <p className="max-w-2xl text-sm text-white/85 sm:text-base">
              From the dusty fields of Mirpur to the polished courts of Chattogram,
              we believe every match deserves to be scheduled fairly, scored accurately,
              and remembered. TourneyBD brings professional tournament infrastructure
              to organizers, teams, referees, and fans — completely free to start.
            </p>
          </div>
        </div>
      </Card>

      {/* STATS */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Trophy} value="120+" label="Tournaments hosted" color="text-amber-500" />
        <StatCard icon={Users} value="450+" label="Teams registered" color="text-emerald-500" />
        <StatCard icon={MapPin} value="64" label="Districts covered" color="text-sky-500" />
        <StatCard icon={ShieldCheck} value="99%" label="Verified players" color="text-violet-500" />
      </div>

      {/* FEATURES */}
      <div className="mt-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Everything you need to run a tournament</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            From registration to trophy lift — TourneyBD handles the entire lifecycle.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* SPORTS */}
      <div className="mt-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Eight sports, end-to-end</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            TourneyBD supports the disciplines that matter to Bangladeshis — from the national obsession with cricket to grassroots football.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {SPORTS_LIST.map((s) => {
            const meta = SPORT_META[s];
            return (
              <Link
                key={s}
                href={`/tournaments?sport=${s}`}
                className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/40 hover:shadow-md"
              >
                <span className="text-3xl">{meta.emoji}</span>
                <span className="text-xs font-medium">{meta.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* BANGLADESH GEO */}
      <Card className="mt-12 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Built for Bangladesh&apos;s geography</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We model every venue as part of the full geographic tree: <strong>Division → District → Upazila → Venue</strong>. That means you can browse tournaments in your upazila, your district, or your entire division — and organizers can schedule matches at the right ground.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.keys(BANGLADESH_DIVISIONS).map((d) => (
                <Badge key={d} variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3 text-primary" /> {d}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ROLES */}
      <div className="mt-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">One platform, four roles</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Whether you&apos;re hosting, competing, officiating, or watching — TourneyBD has a tailored experience for you.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <Card key={r.title} className="overflow-hidden p-0 py-0">
              <div className={`bg-gradient-to-br ${r.color} p-5 text-white`}>
                <r.icon className="h-8 w-8" />
                <h3 className="mt-3 text-lg font-bold">{r.title}</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground">{r.desc}</p>
                <Button asChild variant="link" size="sm" className="mt-3 px-0 text-primary">
                  <Link href={r.href}>
                    {r.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="mt-12 overflow-hidden p-0 py-0">
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-8 text-center sm:p-12">
          <div className="mx-auto max-w-2xl space-y-3 text-white">
            <CheckCircle2 className="mx-auto h-10 w-10 text-amber-300" />
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to bring your tournament online?
            </h2>
            <p className="text-white/85">
              Join hundreds of organizers and teams already running their events on TourneyBD.
              It&apos;s free to start — sign up as an organizer today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg" className="bg-amber-500 text-amber-950 hover:bg-amber-400">
                <Link href="/register">Get started <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon, value, label, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <Card className="p-4 text-center">
      <Icon className={`mx-auto h-6 w-6 ${color}`} />
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
