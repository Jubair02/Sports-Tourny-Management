import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin, Phone, Mail, UserCircle, ShieldCheck, Hash, Users, Trophy,
  ArrowLeft, BadgeCheck, Clock, XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/page-elements";
import { getTeamById } from "@/lib/public-queries";
import {
  PLAYER_VERIFICATION, REG_STATUS_META, SPORT_META,
} from "@/lib/constants";
import { formatDate } from "@/lib/helpers";
import { pickImage, PLAYER_AVATARS } from "@/components/public/images";

const POSITION_LABEL: Record<string, string> = {
  GOALKEEPER: "Goalkeeper",
  DEFENDER: "Defender",
  MIDFIELDER: "Midfielder",
  FORWARD: "Forward",
  BATTER: "Batter",
  BOWLER: "Bowler",
  ALLROUNDER: "All-rounder",
  WICKETKEEPER: "Wicket-keeper",
};

function gradientFor(name: string): string {
  const gradients = [
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-violet-500 to-fuchsia-600",
    "from-cyan-500 to-sky-600",
    "from-lime-500 to-emerald-600",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getTeamById(id);
  if (!team) notFound();

  const initial = (team.name?.[0] || "T").toUpperCase();
  const verifiedCount = team.players.filter((p) => p.verificationStatus === PLAYER_VERIFICATION.VERIFIED).length;
  const pendingCount = team.players.filter((p) => p.verificationStatus === PLAYER_VERIFICATION.PENDING).length;
  const manager = team.manager?.user;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <Link href="/teams"><ArrowLeft className="h-4 w-4" /> All teams</Link>
      </Button>

      {/* HEADER CARD */}
      <Card className="overflow-hidden p-0 py-0">
        <div className="bg-gradient-to-br from-primary to-emerald-800 p-5 sm:p-8 text-primary-foreground">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-4 ring-white/30">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(team.name)} text-3xl font-bold`}>
                  {initial}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{team.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                {team.district && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {team.district}
                  </span>
                )}
                {team.captain && (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Captain: {team.captain}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {team.players.length} players
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <InfoRow icon={UserCircle} label="Manager" value={manager?.name ?? "—"} />
          <InfoRow icon={Phone} label="Phone" value={team.phone || team.manager?.phone || "—"} />
          <InfoRow icon={Mail} label="Email" value={team.email || manager?.email || "—"} />
        </div>
        {team.description && (
          <div className="border-t p-5 text-sm text-muted-foreground">
            <p className="whitespace-pre-line">{team.description}</p>
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* SQUAD */}
        <Card className="lg:col-span-2 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Squad</h2>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="gap-1">
                <BadgeCheck className="h-3 w-3 text-emerald-500" /> {verifiedCount} verified
              </Badge>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3 text-amber-500" /> {pendingCount} pending
                </Badge>
              )}
            </div>
          </div>

          {team.players.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon={Users} title="No players registered" description="This team hasn't added any players to its squad yet." />
            </div>
          ) : (
            <div className="mt-4 max-h-[28rem] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.players.map((p) => {
                    const isVerified = p.verificationStatus === PLAYER_VERIFICATION.VERIFIED;
                    const isPending = p.verificationStatus === PLAYER_VERIFICATION.PENDING;
                    const isRejected = p.verificationStatus === PLAYER_VERIFICATION.REJECTED;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-center">
                          <span className="font-mono tabular-nums">
                            {p.jerseyNumber != null ? `#${p.jerseyNumber}` : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link href={`/players/${p.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted">
                              {p.photo ? (
                                <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold">{p.name?.[0]}</span>
                              )}
                            </span>
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.position ? POSITION_LABEL[p.position] ?? p.position : "—"}
                        </TableCell>
                        <TableCell>
                          {isVerified && (
                            <StatusBadge label="Verified" color="emerald" />
                          )}
                          {isPending && (
                            <StatusBadge label="Pending" color="amber" />
                          )}
                          {isRejected && (
                            <StatusBadge label="Rejected" color="destructive" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="h-4 w-4 text-primary" /> Registered tournaments
            </h3>
            {team.registrations.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">Not registered for any tournament yet.</p>
            ) : (
              <div className="mt-3 space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {team.registrations.map((r) => {
                  const meta = REG_STATUS_META[r.status];
                  return (
                    <Link
                      key={r.id}
                      href={`/tournaments/${r.tournament.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2.5 text-sm transition-colors hover:bg-accent/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-medium">{r.tournament.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {SPORT_META[r.tournament.sport]?.label} · Registered {formatDate(r.registeredAt)}
                        </p>
                      </div>
                      {meta && <StatusBadge label={meta.label} color={meta.color} />}
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {team.address && (
            <Card className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> Address
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{team.address}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="line-clamp-1 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
