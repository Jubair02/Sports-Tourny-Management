import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ShieldAlert } from "lucide-react";
import { RaiseDisputeDialog } from "@/components/team/raise-dispute-dialog";
import { formatDateTime } from "@/lib/helpers";
import { DISPUTE_TYPE_META, DISPUTE_STATUS_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DisputesPage() {
  const session = await getSession();
  let profile = session ? await getTeamManagerProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.teamManagerProfile.findFirst({ include: { user: true } });
  }

  const teams = profile
    ? await db.team.findMany({
        where: { managerId: profile.id },
        select: { id: true, name: true },
      })
    : [];
  const teamIds = teams.map((t) => t.id);

  // my team's matches
  const myMatches = teamIds.length
    ? await db.match.findMany({
        where: {
          OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
        },
        include: { homeTeam: true, awayTeam: true, tournament: true },
        orderBy: { matchDate: "desc" },
        take: 50,
      })
    : [];

  const myTournaments = await db.tournamentRegistration.findMany({
    where: { team: { managerId: profile?.id } },
    include: { tournament: true },
    distinct: ["tournamentId"],
  });
  const tournamentOpts = myTournaments.map((r) => ({ id: r.tournamentId, label: r.tournament.name }));
  const matchOpts = myMatches.map((m) => ({
    id: m.id,
    label: `${m.matchCode ?? "M"}: ${m.homeTeam?.name ?? "?"} vs ${m.awayTeam?.name ?? "?"}`,
  }));

  const disputesRaw = session
    ? await db.dispute.findMany({
        where: { raisedById: session.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Dispute model has no relation to Tournament/Match — resolve manually.
  const dtourIds = Array.from(new Set(disputesRaw.map((d) => d.tournamentId).filter(Boolean) as string[]));
  const dmatchIds = Array.from(new Set(disputesRaw.map((d) => d.matchId).filter(Boolean) as string[]));
  const [dTour, dMatch] = await Promise.all([
    dtourIds.length
      ? db.tournament.findMany({ where: { id: { in: dtourIds } }, select: { id: true, name: true } })
      : Promise.resolve([] as { id: string; name: string }[]),
    dmatchIds.length
      ? db.match.findMany({
          where: { id: { in: dmatchIds } },
          select: { id: true, matchCode: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
        })
      : Promise.resolve(
          [] as {
            id: string;
            matchCode: string | null;
            homeTeam: { name: string } | null;
            awayTeam: { name: string } | null;
          }[],
        ),
  ]);
  const tournamentMap = new Map(dTour.map((t) => [t.id, t]));
  const matchMap = new Map(dMatch.map((m) => [m.id, m]));
  const disputes = disputesRaw.map((d) => ({
    ...d,
    tournament: d.tournamentId ? tournamentMap.get(d.tournamentId) ?? null : null,
    match: d.matchId ? matchMap.get(d.matchId) ?? null : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        description="Raise issues with tournament organizers or admins."
      >
        <RaiseDisputeDialog tournaments={tournamentOpts} matches={matchOpts} />
      </PageHeader>

      {disputes.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No disputes raised"
          description="If you spot an issue with a result, fixture, or player, raise a dispute here."
          action={<RaiseDisputeDialog tournaments={tournamentOpts} matches={matchOpts} />}
        />
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => {
            const statusMeta = DISPUTE_STATUS_META[d.status] ?? { label: d.status, color: "secondary" };
            const typeLabel = DISPUTE_TYPE_META[d.type] ?? d.type;
            return (
              <Card key={d.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={typeLabel} color="secondary" />
                    <StatusBadge label={statusMeta.label} color={statusMeta.color} dot />
                    <span className="text-xs text-muted-foreground">{formatDateTime(d.createdAt)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{d.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {d.tournament && <span>Tournament: {d.tournament.name}</span>}
                    {d.match && (
                      <span>
                        Match: {d.match.homeTeam?.name ?? "?"} vs {d.match.awayTeam?.name ?? "?"}
                      </span>
                    )}
                  </div>
                  {d.resolution && (
                    <div className="rounded-md border bg-muted/40 p-2 text-xs">
                      <span className="font-medium">Resolution: </span>
                      <span className="text-muted-foreground">{d.resolution}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
