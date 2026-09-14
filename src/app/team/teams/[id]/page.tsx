import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile } from "@/lib/queries";
import { PageHeader, EmptyState, SectionHeading } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, MapPin, Phone, Mail, Calendar, ShieldCheck, Trophy, ArrowLeft, User,
} from "lucide-react";
import { TeamFormDialog } from "@/components/team/team-form-dialog";
import { PlayerFormDialog } from "@/components/team/player-form-dialog";
import { formatDate } from "@/lib/helpers";
import { REG_STATUS_META, SPORT_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let profile = session ? await getTeamManagerProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.teamManagerProfile.findFirst({ include: { user: true } });
  }

  const team = await db.team.findUnique({
    where: { id },
    include: {
      players: { orderBy: [{ jerseyNumber: "asc" }, { name: "asc" }] },
      registrations: { include: { tournament: true }, orderBy: { registeredAt: "desc" } },
      participants: { include: { tournament: true } },
    },
  });

  if (!team) notFound();

  // Ownership check
  const isOwner = profile && team.managerId === profile.id;
  const isAdmin = session?.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Access Denied" description="You don't manage this team." />
        <EmptyState title="Not your team" description="You can only view teams you manage." />
      </div>
    );
  }

  // Determine sport for position options — infer from registrations
  const sport = team.registrations[0]?.tournament?.sport ?? "FOOTBALL";
  const sportMeta = SPORT_META[sport];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/team/teams" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to teams
        </Link>
      </div>

      {/* Team header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
              ) : (
                <Users className="h-9 w-9" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
                {sportMeta && <StatusBadge label={`${sportMeta.emoji} ${sportMeta.label}`} color={sportMeta.color} />}
              </div>
              {team.description && (
                <p className="text-sm text-muted-foreground max-w-3xl">{team.description}</p>
              )}
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                {team.captain && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Captain: {team.captain}</span>}
                {team.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {team.phone}</span>}
                {team.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {team.email}</span>}
                {team.district && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {team.district}</span>}
                {team.address && <span className="flex items-center gap-1.5 sm:col-span-2 lg:col-span-4"><MapPin className="h-3.5 w-3.5" /> {team.address}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <TeamFormDialog mode="edit" team={team} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Squad */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" /> Squad ({team.players.length})
            </CardTitle>
            <PlayerFormDialog teamId={team.id} teamSport={sport} mode="create" />
          </CardHeader>
          <CardContent>
            {team.players.length === 0 ? (
              <EmptyState
                icon={User}
                title="No players yet"
                description="Add players to your squad to register for tournaments."
                action={<PlayerFormDialog teamId={team.id} teamSport={sport} mode="create" />}
              />
            ) : (
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">#</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="hidden md:table-cell">Position</TableHead>
                      <TableHead className="hidden lg:table-cell">DOB</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.players.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.jerseyNumber ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-bold">
                              {p.photo ? (
                                <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
                              ) : (
                                p.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="font-medium">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{p.position ?? "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {p.dateOfBirth ? formatDate(p.dateOfBirth) : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={
                              p.verificationStatus === "VERIFIED" ? "Verified" :
                              p.verificationStatus === "PENDING" ? "Pending" : "Rejected"
                            }
                            color={
                              p.verificationStatus === "VERIFIED" ? "emerald" :
                              p.verificationStatus === "PENDING" ? "amber" : "destructive"
                            }
                            dot
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <PlayerFormDialog teamId={team.id} teamSport={sport} mode="edit" player={p} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registrations */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" /> Registrations
            </CardTitle>
            <Link href="/team/tournaments" className="text-xs text-primary hover:underline">Browse</Link>
          </CardHeader>
          <CardContent>
            {team.registrations.length === 0 ? (
              <EmptyState icon={Trophy} title="No registrations" description="Apply to an open tournament." />
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                {team.registrations.map((r) => {
                  const meta = REG_STATUS_META[r.status] ?? { label: r.status, color: "secondary" };
                  return (
                    <li key={r.id} className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium">{r.tournament.name}</p>
                        <StatusBadge label={meta.label} color={meta.color} dot />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Applied {formatDate(r.registeredAt)}</p>
                      {r.rejectionReason && r.status === "REJECTED" && (
                        <p className="text-xs text-destructive">Reason: {r.rejectionReason}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <SectionHeading title="Quick Stats" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Squad Size</p>
          <p className="text-2xl font-bold tabular-nums">{team.players.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Verified</p>
          <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {team.players.filter((p) => p.verificationStatus === "VERIFIED").length}
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {team.players.filter((p) => p.verificationStatus === "PENDING").length}
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Tournaments</p>
          <p className="text-2xl font-bold tabular-nums">{team.registrations.length}</p>
        </CardContent></Card>
      </div>
    </div>
  );
}
