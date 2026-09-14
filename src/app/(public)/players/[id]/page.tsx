import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Hash, MapPin, CalendarDays, ShieldCheck, Users, BadgeCheck,
  Clock, XCircle, Phone, Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/page-elements";
import { getPlayerById } from "@/lib/queries";
import { PLAYER_VERIFICATION } from "@/lib/constants";
import { formatDate } from "@/lib/helpers";

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

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPlayerById(id);
  if (!p) notFound();

  const isVerified = p.verificationStatus === PLAYER_VERIFICATION.VERIFIED;
  const isPending = p.verificationStatus === PLAYER_VERIFICATION.PENDING;
  const isRejected = p.verificationStatus === PLAYER_VERIFICATION.REJECTED;
  const team = p.team;
  const manager = team?.manager?.user;
  const initial = (p.name?.[0] || "P").toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <Link href="/players"><ArrowLeft className="h-4 w-4" /> All players</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* PROFILE */}
        <Card className="lg:col-span-1 overflow-hidden p-0 py-0">
          <div className="bg-gradient-to-br from-primary to-emerald-800 p-6 text-primary-foreground">
            <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full ring-4 ring-white/30">
              {p.photo ? (
                <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-bold">{initial}</span>
              )}
            </div>
            <div className="mt-4 text-center">
              <h1 className="text-xl font-extrabold tracking-tight">{p.name}</h1>
              {p.position && (
                <p className="mt-1 text-sm text-white/80">
                  {POSITION_LABEL[p.position] ?? p.position}
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {p.jerseyNumber != null && (
                <Badge className="bg-white/20 text-white">
                  <Hash className="h-3 w-3" /> #{p.jerseyNumber}
                </Badge>
              )}
              {isVerified && (
                <Badge className="bg-emerald-500/30 text-white">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
              {isPending && (
                <Badge className="bg-amber-500/30 text-white">
                  <Clock className="h-3 w-3" /> Pending
                </Badge>
              )}
              {isRejected && (
                <Badge className="bg-red-500/30 text-white">
                  <XCircle className="h-3 w-3" /> Rejected
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-3 p-5">
            <InfoRow icon={CalendarDays} label="Date of birth" value={p.dateOfBirth ? formatDate(p.dateOfBirth) : "—"} />
            <InfoRow icon={ShieldCheck} label="NID verification" value={isVerified ? "Verified by TourneyBD" : isPending ? "Verification pending" : isRejected ? "Rejected" : "—"} />
            {p.phone && (
              <InfoRow icon={Phone} label="Phone" value={p.phone} />
            )}
            <div className="border-t pt-3 text-xs text-muted-foreground">
              <p>
                Identity verification is performed by TourneyBD administrators and tournament organizers.
                Personal documents (such as NID numbers) are never displayed publicly.
              </p>
            </div>
          </div>
        </Card>

        {/* MAIN */}
        <div className="lg:col-span-2 space-y-6">
          {/* TEAM */}
          {team ? (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Registered team</h2>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/teams/${team.id}`}>View team</Link>
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-4 rounded-xl border bg-card p-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-emerald-700 text-lg font-bold text-primary-foreground">
                  {team.name?.[0] ?? "T"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{team.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {team.district && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {team.district}
                      </span>
                    )}
                    {team.captain && (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Captain: {team.captain}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {manager && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> Manager: {manager.name}
                  {manager.phone && <span>· {manager.phone}</span>}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-5 sm:p-6">
              <EmptyState
                icon={Users}
                title="Not attached to a team"
                description="This player is currently unaffiliated."
              />
            </Card>
          )}

          {/* INFO */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">Player information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow icon={Hash} label="Jersey number" value={p.jerseyNumber != null ? `#${p.jerseyNumber}` : "—"} />
              <InfoRow icon={ShieldCheck} label="Position" value={p.position ? POSITION_LABEL[p.position] ?? p.position : "—"} />
              <InfoRow icon={BadgeCheck} label="Verification" value={isVerified ? "Verified" : isPending ? "Pending" : "Rejected"} />
              <InfoRow icon={CalendarDays} label="Joined" value={formatDate(p.createdAt)} />
            </div>
          </Card>

          {/* NOTE */}
          {isPending && (
            <Card className="border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium">Verification pending</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This player&apos;s identity documents have been submitted and are awaiting
                    verification by the team manager and the platform administrators.
                  </p>
                </div>
              </div>
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
    <div className="flex items-start gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium line-clamp-1">{value}</p>
      </div>
    </div>
  );
}
