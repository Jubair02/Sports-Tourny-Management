import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusWorkflowActions } from "@/components/organizer/status-workflow-actions";
import { TournamentSettingsForm } from "@/components/organizer/tournament-settings-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TOURNAMENT_STATUS_META } from "@/lib/constants";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });
  const tournament = await db.tournament.findUnique({ where: { id } });
  if (!tournament) notFound();
  if (session.role !== "ADMIN" && (!prof || prof.id !== tournament.organizerId)) notFound();

  const settings = {
    name: tournament.name,
    sport: tournament.sport,
    description: tournament.description,
    division: tournament.division,
    district: tournament.district,
    upazila: tournament.upazila,
    location: tournament.location,
    venueId: tournament.venueId,
    startDate: tournament.startDate.toISOString(),
    endDate: tournament.endDate.toISOString(),
    regStart: tournament.regStart.toISOString(),
    regDeadline: tournament.regDeadline.toISOString(),
    entryFee: tournament.entryFee,
    maxTeams: tournament.maxTeams,
    minTeams: tournament.minTeams,
    format: tournament.format,
    ageCategory: tournament.ageCategory,
    gender: tournament.gender,
    rules: tournament.rules,
    prizeMoney: tournament.prizeMoney,
    category: tournament.category,
    winPoints: tournament.winPoints,
    drawPoints: tournament.drawPoints,
    lossPoints: tournament.lossPoints,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Link href={`/organizer/tournaments/${id}`} className="text-muted-foreground hover:text-foreground">Tournaments</Link>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span>Settings</span>
          </> as any
        }
        description={`Configure ${tournament.name}.`}
      />

      {/* Status workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span>Status Workflow</span>
            <StatusBadge
              label={TOURNAMENT_STATUS_META[tournament.status]?.label ?? tournament.status}
              color={TOURNAMENT_STATUS_META[tournament.status]?.color ?? "secondary"}
              dot
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p>Only specific transitions are allowed at each status.</p>
              <p className="mt-1">DRAFT → submit for approval → (admin approves externally) → PUBLISHED → open registration → close → generate fixtures → start → complete.</p>
            </div>
          </div>
          <StatusWorkflowActions
            tournamentId={tournament.id}
            tournamentName={tournament.name}
            currentStatus={tournament.status}
            isAdmin={session.role === "ADMIN"}
          />
        </CardContent>
      </Card>

      {/* Settings form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentSettingsForm tournamentId={id} tournament={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
