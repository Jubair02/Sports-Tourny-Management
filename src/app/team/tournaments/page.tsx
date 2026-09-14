import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile } from "@/lib/queries";
import { PageHeader, EmptyState, SectionHeading } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";
import { Trophy, Calendar, Users, MapPin } from "lucide-react";
import { RegisterTournamentDialog } from "@/components/team/register-tournament-dialog";
import { formatDate, taka } from "@/lib/helpers";
import { REG_STATUS_META, TOURNAMENT_STATUS_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const session = await getSession();
  let profile = session ? await getTeamManagerProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.teamManagerProfile.findFirst({ include: { user: true } });
  }

  const [openTournaments, myTeams, myRegistrations] = await Promise.all([
    db.tournament.findMany({
      where: { status: "REGISTRATION_OPEN" },
      include: {
        venue: true,
        organizer: { include: { user: true } },
        _count: { select: { registrations: true, participants: true } },
      },
      orderBy: { regDeadline: "asc" },
    }),
    profile
      ? db.team.findMany({
          where: { managerId: profile.id },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    profile
      ? db.tournamentRegistration.findMany({
          where: { team: { managerId: profile.id } },
          include: { tournament: { include: { venue: true } }, team: true },
          orderBy: { registeredAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const registeredTeamIds = new Set(myRegistrations.map((r) => `${r.tournamentId}:${r.teamId}`));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tournaments"
        description="Browse open tournaments and register your teams."
      />

      <SectionHeading title="Open for Registration" description={`${openTournaments.length} tournament(s) accepting applications now.`} />

      {openTournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No open tournaments"
          description="Check back later — new tournaments open regularly."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {openTournaments.map((t) => {
            const statusMeta = TOURNAMENT_STATUS_META[t.status] ?? { label: t.status, color: "secondary" };
            const slotsLeft = Math.max(0, t.maxTeams - t._count.registrations);
            return (
              <Card key={t.id} className="overflow-hidden">
                <div className="relative h-24 w-full bg-gradient-to-br from-emerald-500/20 via-emerald-700/15 to-amber-500/15">
                  {t.banner ? (
                    <img src={t.banner} alt={t.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Trophy className="h-9 w-9 text-emerald-500/40" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{t.name}</h3>
                    <StatusBadge label={statusMeta.label} color={statusMeta.color} dot />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SportBadge sport={t.sport} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(t.startDate)}
                    </span>
                    {t.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {t.venue.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {t._count.registrations}/{t.maxTeams} applied
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">{slotsLeft} slots left</span>
                  </div>
                  {t.entryFee > 0 && <p className="text-sm font-medium">Entry: {taka(t.entryFee)}</p>}
                  <p className="text-[10px] text-muted-foreground">Reg. deadline: {formatDate(t.regDeadline)}</p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Link
                      href={`/tournaments/${t.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View details
                    </Link>
                    {myTeams.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Create a team first</span>
                    ) : (
                      <RegisterTournamentDialog tournament={t} teams={myTeams} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SectionHeading title="My Registrations" description="Tournaments you've applied for." />

      {myRegistrations.length === 0 ? (
        <EmptyState icon={Trophy} title="No registrations yet" description="Apply to an open tournament above." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Tournament</th>
                    <th className="px-4 py-3 text-left font-medium">Team</th>
                    <th className="px-4 py-3 text-left font-medium">Payment</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {myRegistrations.map((r) => {
                    const meta = REG_STATUS_META[r.status] ?? { label: r.status, color: "secondary" };
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-accent/40">
                        <td className="px-4 py-3">
                          <Link href={`/tournaments/${r.tournamentId}`} className="font-medium text-primary hover:underline">
                            {r.tournament.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{r.tournament.venue?.name ?? "Venue TBD"}</p>
                        </td>
                        <td className="px-4 py-3">{r.team.name}</td>
                        <td className="px-4 py-3">
                          <StatusBadge label={r.paymentStatus} color={r.paymentStatus === "PAID" || r.paymentStatus === "VERIFIED" ? "emerald" : "amber"} />
                        </td>
                        <td className="px-4 py-3"><StatusBadge label={meta.label} color={meta.color} dot /></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.registeredAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
