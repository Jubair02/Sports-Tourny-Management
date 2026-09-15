import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Users, Trophy, MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { TeamFormDialog } from "@/components/team/team-form-dialog";
import { formatDate } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await getSession();
  let profile = session ? await getTeamManagerProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.teamManagerProfile.findFirst({ include: { user: true } });
  }

  const teams = profile
    ? await db.team.findMany({
        where: { managerId: profile.id },
        include: {
          players: { select: { id: true, verificationStatus: true } },
          registrations: { include: { tournament: { select: { id: true, name: true, sport: true } } } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Teams"
        description="Create and manage teams under your account."
      >
        <TeamFormDialog mode="create" />
      </PageHeader>

      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create your first team to register for tournaments and build your squad."
          action={<TeamFormDialog mode="create" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => {
            const pendingPlayers = t.players.filter((p) => p.verificationStatus === "PENDING").length;
            const approvedRegs = t.registrations.filter((r) => r.status === "APPROVED").length;
            return (
              <Card key={t.id} className="overflow-hidden">
                <div className="relative h-24 w-full bg-gradient-to-br from-emerald-500/20 via-emerald-700/15 to-amber-500/15">
                  {t.logo ? (
                    <img src={t.logo} alt={t.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Users className="h-9 w-9 text-emerald-500/40" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <h3 className="font-semibold leading-tight">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t.captain ? `Captain: ${t.captain}` : "No captain set"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {t.players.length} players
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" /> {approvedRegs} approved
                    </span>
                    {t.district && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {t.district}
                      </span>
                    )}
                  </div>
                  {pendingPlayers > 0 && (
                    <StatusBadge label={`${pendingPlayers} players pending`} color="amber" dot />
                  )}
                  {(t.phone || t.email) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      {t.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {t.phone}</span>}
                      {t.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {t.email}</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">Created {formatDate(t.createdAt)}</span>
                    <Link
                      href={`/team/teams/${t.id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View squad <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
