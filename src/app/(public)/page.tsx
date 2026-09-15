import Link from "next/link";
import {
  Trophy, Users, CalendarDays, TrendingUp, ArrowRight, MapPin,
  ShieldCheck, Megaphone, Clock, BarChart3, Star, Sparkles, PlayCircle,
  ChevronRight, Wallet, Building2, UserCheck, Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading, EmptyState } from "@/components/shared/page-elements";
import { SportBadge } from "@/components/shared/sport-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { TournamentCard } from "@/components/public/tournament-card";
import { TeamCard } from "@/components/public/team-card";
import { MatchCard } from "@/components/public/match-card";
import { StandingsTable } from "@/components/public/standings-table";
import {
  getFeaturedTournaments,
  getTodaysMatches,
  getUpcomingMatches,
  getRecentResults,
  getRankings,
  getTeams,
  getTournaments,
} from "@/lib/queries";
import {
  SPORT_META, SPORTS_LIST, TOURNAMENT_STATUS_META, MATCH_STATUS_META,
} from "@/lib/constants";
import { formatDate, formatTime, relativeTime } from "@/lib/helpers";
import { HERO_IMAGE, SPORT_BANNER } from "@/components/public/images";

export const revalidate = 60;

function StatChip({
  value, label, icon: Icon,
}: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white backdrop-blur">
      <Icon className="h-4 w-4 text-amber-300" />
      <span className="text-sm font-bold tabular-nums">{value}</span>
      <span className="text-xs text-white/80">{label}</span>
    </div>
  );
}

function Section({
  children, className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className ?? ""}`}>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const [
    featured, todays, upcoming, recent, rankings, teams, allTournaments,
  ] = await Promise.all([
    getFeaturedTournaments(6),
    getTodaysMatches(),
    getUpcomingMatches(6),
    getRecentResults(6),
    getRankings({ limit: 5 }),
    getTeams({ limit: 6 }),
    getTournaments({ publishedOnly: true, limit: 100 }),
  ]);

  const totalTeams = allTournaments.reduce(
    (acc, t) => acc + (t._count?.registrations ?? 0), 0,
  );

  return (
    <div className="space-y-16 pb-16">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-900/80 to-emerald-700/60" />
          <div className="absolute inset-0 bg-grid opacity-[0.15]" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-20 sm:px-6 sm:py-28 lg:flex-row lg:items-center lg:py-32">
          <div className="flex-1 space-y-6 text-white">
            <Badge className="bg-amber-500/20 text-amber-200 ring-1 ring-amber-300/30 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Bangladesh&apos;s #1 Tournament Platform
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Run Your Tournaments <span className="text-amber-300">Like a Pro</span>
            </h1>
            <p className="max-w-xl text-balance text-base text-white/85 sm:text-lg">
              From Mirpur football nights to Chattogram cricket derbies — TourneyBD
              helps organizers, teams and fans manage every match, score, and
              ranking across all 64 districts of Bangladesh.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-amber-500 text-amber-950 hover:bg-amber-400">
                <Link href="/tournaments">
                  Explore Tournaments <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href="/register">
                  Become an Organizer
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <StatChip value="120+" label="Tournaments" icon={Trophy} />
              <StatChip value="450+" label="Teams" icon={Users} />
              <StatChip value="8" label="Sports" icon={BarChart3} />
              <StatChip value="64" label="Districts" icon={MapPin} />
            </div>
          </div>

          <div className="hidden lg:block lg:w-[380px]">
            <div className="rotate-2 space-y-3 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-amber-950">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Live Tonight</p>
                    <p className="text-[10px] text-white/70">Dhaka Football League</p>
                  </div>
                </div>
                <Badge className="bg-red-500 text-white">LIVE</Badge>
              </div>
              <div className="grid grid-cols-3 items-center gap-2 rounded-xl bg-white/10 p-3 text-white">
                <div className="text-center">
                  <p className="text-xs text-white/70">Dhaka Warriors</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <p className="text-center text-white/70">vs</p>
                <div className="text-center">
                  <p className="text-xs text-white/70">CTG Strikers</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
              </div>
              <p className="text-center text-[10px] text-white/60">78&apos; · Bangabandhu Stadium</p>
            </div>
          </div>
        </div>
      </section>

      {/* SPORT CATEGORIES */}
      <Section>
        <SectionHeading
          title="Browse by sport"
          description="Eight disciplines supported end-to-end — from grassroots to corporate cups."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/tournaments">View all <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          }
        />
        <div className="mt-5 flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
          {SPORTS_LIST.map((s) => {
            const meta = SPORT_META[s];
            return (
              <Link
                key={s}
                href={`/tournaments?sport=${s}`}
                className="group flex w-32 shrink-0 flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl transition-transform group-hover:scale-110">
                  {meta.emoji}
                </div>
                <p className="text-sm font-medium">{meta.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {Math.max(0, allTournaments.filter((t) => t.sport === s).length)} events
                </p>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* FEATURED TOURNAMENTS */}
      <Section>
        <SectionHeading
          title="Featured tournaments"
          description="Hot events across the country right now."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/tournaments">All tournaments <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          }
        />
        {featured.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon={Trophy} title="No featured tournaments" description="Check back soon." />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </Section>

      {/* TODAY'S MATCHES */}
      <Section>
        <SectionHeading
          title="Today's matches"
          description="Catch the action happening right now and later today."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/fixtures?tab=today">All fixtures <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          }
        />
        {todays.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={CalendarDays}
              title="No matches scheduled today"
              description="Browse upcoming fixtures instead."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/fixtures">See upcoming <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-5 flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
            {todays.map((m) => (
              <div key={m.id} className="w-[330px] shrink-0">
                <MatchCard match={m} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* UPCOMING + RECENT RESULTS — two-column */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <SectionHeading
              title="Upcoming matches"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/fixtures">More <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              }
            />
            <div className="space-y-2">
              {upcoming.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No upcoming matches" />
              ) : (
                upcoming.map((m) => (
                  <Link
                    key={m.id}
                    href={`/tournaments/${m.tournament.id}/matches`}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">
                        {m.homeTeam?.name ?? "TBD"} <span className="text-muted-foreground">vs</span> {m.awayTeam?.name ?? "TBD"}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {m.matchDate ? `${formatDate(m.matchDate)} · ${formatTime(m.matchDate)}` : "TBD"}
                        <span>·</span>
                        <span className="line-clamp-1">{m.tournament?.name}</span>
                      </p>
                    </div>
                    <StatusBadge label={MATCH_STATUS_META[m.status]?.label ?? m.status} color={MATCH_STATUS_META[m.status]?.color} />
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeading
              title="Recent results"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/results">More <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              }
            />
            <div className="space-y-2">
              {recent.length === 0 ? (
                <EmptyState icon={BarChart3} title="No results yet" />
              ) : (
                recent.map((m) => {
                  const homeWon = (m.homeScore ?? 0) > (m.awayScore ?? 0);
                  const awayWon = (m.awayScore ?? 0) > (m.homeScore ?? 0);
                  return (
                    <Link
                      key={m.id}
                      href={`/tournaments/${m.tournament.id}/matches`}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium">
                          <span className={homeWon ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>
                            {m.homeTeam?.name ?? "TBD"}
                          </span>
                          <span className="px-1.5 text-muted-foreground">{m.homeScore} - {m.awayScore}</span>
                          <span className={awayWon ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>
                            {m.awayTeam?.name ?? "TBD"}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {m.matchDate ? relativeTime(m.matchDate) : ""} · {m.tournament?.name}
                        </p>
                      </div>
                      {m.playerOfMatch && (
                        <Badge variant="outline" className="gap-1 hidden sm:flex">
                          <Star className="h-3 w-3 text-amber-500" /> POTM
                        </Badge>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* RANKINGS + POPULAR TEAMS */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3 p-4 sm:p-6">
            <SectionHeading
              title="Top rankings"
              description="Best-performing teams across all TourneyBD events."
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/rankings">Full ranking <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              }
            />
            {rankings.length === 0 ? (
              <div className="mt-4">
                <EmptyState icon={TrendingUp} title="No rankings yet" />
              </div>
            ) : (
              <div className="mt-4 max-h-96 overflow-y-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pl-2 text-center w-10">#</th>
                      <th className="py-2 pl-2">Team</th>
                      <th className="py-2 text-center">P</th>
                      <th className="py-2 text-center">W</th>
                      <th className="py-2 text-center">D</th>
                      <th className="py-2 text-center">L</th>
                      <th className="py-2 pr-2 text-center font-semibold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((r, i) => (
                      <tr
                        key={r.team.id}
                        className={i === 0 ? "border-b bg-amber-500/10 last:border-b-0" : "border-b last:border-b-0"}
                      >
                        <td className="py-2 pl-2 text-center">
                          <span className={`font-bold ${i === 0 ? "text-amber-500" : ""}`}>{i + 1}</span>
                        </td>
                        <td className="py-2 pl-2">
                          <Link href={`/teams/${r.team.id}`} className="font-medium hover:text-primary">
                            {r.team.name}
                          </Link>
                        </td>
                        <td className="py-2 text-center tabular-nums">{r.played}</td>
                        <td className="py-2 text-center tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{r.won}</td>
                        <td className="py-2 text-center tabular-nums">{r.drawn}</td>
                        <td className="py-2 text-center tabular-nums text-muted-foreground">{r.lost}</td>
                        <td className="py-2 pr-2 text-center font-bold tabular-nums">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <SectionHeading
              title="Popular teams"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/teams">All teams <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {teams.length === 0 ? (
                <div className="sm:col-span-2">
                  <EmptyState icon={Users} title="No teams registered yet" />
                </div>
              ) : (
                teams.map((t) => <TeamCard key={t.id} team={t} />)
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section>
        <div className="rounded-2xl border bg-card p-6 sm:p-10">
          <div className="text-center">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Gamepad2 className="h-3.5 w-3.5" /> How it works
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">One platform, three ways to play</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Whether you&apos;re hosting, competing, or just cheering from the stands — TourneyBD has you covered.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <HowItWorksCard
              icon={Megaphone}
              step="01"
              title="For Organizers"
              desc="Create your tournament, set entry fees, approve team registrations, generate fixtures, and publish results — all from one dashboard."
              href="/register"
              cta="Become an Organizer"
            />
            <HowItWorksCard
              icon={ShieldCheck}
              step="02"
              title="For Teams & Players"
              desc="Register your squad, manage your roster with verified players, track fixtures, and climb the rankings across multiple tournaments."
              href="/register"
              cta="Register your Team"
            />
            <HowItWorksCard
              icon={PlayCircle}
              step="03"
              title="For Fans"
              desc="Follow live scores, browse upcoming fixtures, check standings, and discover rising stars from your district and beyond."
              href="/fixtures"
              cta="Explore Fixtures"
            />
          </div>
        </div>
      </Section>

      {/* CTA BANNER */}
      <Section>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 p-8 sm:p-12">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="relative flex flex-col items-start gap-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to host your tournament?
              </h2>
              <p className="max-w-xl text-white/85">
                Join hundreds of organizers across Bangladesh running professional,
                transparent, and engaging sports events on TourneyBD.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-amber-500 text-amber-950 hover:bg-amber-400">
                <Link href="/register">Get started free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Stats strip */}
      <Section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat icon={Trophy} value={`${allTournaments.length}+`} label="Tournaments hosted" />
          <MiniStat icon={Users} value="450+" label="Teams registered" />
          <MiniStat icon={Building2} value="64" label="Districts covered" />
          <MiniStat icon={UserCheck} value="99%" label="Verified players" />
        </div>
      </Section>
    </div>
  );
}

function HowItWorksCard({
  icon: Icon, step, title, desc, href, cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  step: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute -top-2 right-3 text-5xl font-bold text-primary/10">{step}</div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
      <Button asChild size="sm" variant="link" className="mt-3 px-0 text-primary">
        <Link href={href}>{cta} <ArrowRight className="h-3.5 w-3.5" /></Link>
      </Button>
    </Card>
  );
}

function MiniStat({
  icon: Icon, value, label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-primary" />
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
