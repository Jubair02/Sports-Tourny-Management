import { notFound } from "next/navigation";
import { Users, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/page-elements";
import { TeamCard } from "@/components/public/team-card";
import { TournamentSubHeader } from "@/components/public/tournament-sub-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { getTournamentById } from "@/lib/public-queries";
import { REG_STATUS_META } from "@/lib/constants";

export default async function TournamentTeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTournamentById(id);
  if (!t) notFound();

  const approved = t.registrations.filter((r) => r.status === "APPROVED");
  const pending = t.registrations.filter((r) => r.status === "PENDING");
  const rejected = t.registrations.filter((r) => r.status === "REJECTED");

  return (
    <div>
      <TournamentSubHeader t={t} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Teams</h2>
            <p className="text-sm text-muted-foreground">
              {approved.length} approved of {t.registrations.length} registered · max {t.maxTeams}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {approved.length} approved
            </Badge>
            {pending.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3 text-amber-500" /> {pending.length} pending
              </Badge>
            )}
            {rejected.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3 text-red-500" /> {rejected.length} rejected
              </Badge>
            )}
          </div>
        </div>

        {approved.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={Users}
              title="No approved teams yet"
              description="Teams will appear here once the organizer approves registrations."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((r) => (
              <TeamCard key={r.id} team={{ ...r.team, sport: t.sport }} />
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <Card className="mt-8 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-amber-500" /> Pending registrations
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {pending.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span className="font-medium line-clamp-1">{r.team.name}</span>
                  <StatusBadge label={REG_STATUS_META.PENDING.label} color={REG_STATUS_META.PENDING.color} />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
