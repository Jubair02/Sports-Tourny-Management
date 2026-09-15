import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { GenerateFixturesButton } from "@/components/organizer/generate-fixtures-button";
import { EditMatchDialog } from "@/components/organizer/edit-match-dialog";
import { AssignRefereeDialog } from "@/components/organizer/assign-referee-dialog";
import {
  TOURNAMENT_STATUS, MATCH_STATUS_META, RESULT_STATUS_META,
} from "@/lib/constants";
import { formatDateTime, formatTime } from "@/lib/helpers";
import { CalendarDays, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FixturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });

  const tournament = await db.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, organizerId: true, format: true, status: true, venueId: true },
  });
  if (!tournament) notFound();
  if (session.role !== "ADMIN" && (!prof || prof.id !== tournament.organizerId)) notFound();

  const [matches, venues, approvedCount, approvedRegs] = await Promise.all([
    db.match.findMany({
      where: { tournamentId: id },
      include: {
        homeTeam: true, awayTeam: true, venue: true,
        assignment: { include: { referee: { include: { user: true } } } },
      },
      orderBy: { matchDate: "asc" },
    }),
    db.venue.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.tournamentParticipant.count({ where: { tournamentId: id } }),
    db.tournamentRegistration.count({ where: { tournamentId: id, status: "APPROVED" } }),
  ]);

  const referees = await db.refereeProfile.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });
  const refereeList = referees.map((r) => ({
    id: r.id,
    name: r.user.name,
    specialization: r.specialization,
    district: r.district,
  }));

  const canGenerate =
    (tournament.status === TOURNAMENT_STATUS.REGISTRATION_CLOSED || tournament.status === TOURNAMENT_STATUS.REGISTRATION_OPEN) &&
    matches.length === 0 &&
    approvedRegs >= 2;
  const disabledReason = matches.length > 0
    ? "Matches already exist — delete them before regenerating."
    : tournament.status !== TOURNAMENT_STATUS.REGISTRATION_CLOSED && tournament.status !== TOURNAMENT_STATUS.REGISTRATION_OPEN
    ? `Tournament status is ${tournament.status}. Must be Registration Open or Closed.`
    : approvedRegs < 2
    ? `Only ${approvedRegs} approved team(s) — need at least 2.`
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Link href={`/organizer/tournaments/${id}`} className="text-muted-foreground hover:text-foreground">Tournaments</Link>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span>Fixtures</span>
          </> as any
        }
        description={`Manage match schedule & referee assignments for ${tournament.name}.`}
      >
        <GenerateFixturesButton
          tournamentId={id}
          tournamentName={tournament.name}
          format={tournament.format}
          approvedCount={approvedCount}
          disabled={!canGenerate}
          disabledReason={disabledReason}
        />
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {matches.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No fixtures yet"
              description={
                canGenerate
                  ? "Click 'Generate Fixtures' to create matches based on your tournament format."
                  : disabledReason || "Fixtures will appear here once generated."
              }
              action={canGenerate ? (
                <GenerateFixturesButton
                  tournamentId={id}
                  tournamentName={tournament.name}
                  format={tournament.format}
                  approvedCount={approvedCount}
                />
              ) : undefined}
            />
          ) : (
            <div className="max-h-[75vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead className="hidden md:table-cell">Round</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead className="hidden md:table-cell">Date &amp; Time</TableHead>
                    <TableHead className="hidden lg:table-cell">Venue</TableHead>
                    <TableHead>Referee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.matchCode ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{m.round ?? "—"}</TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {m.homeTeam?.name ?? "TBD"}
                            <span className="mx-1 text-muted-foreground">vs</span>
                            {m.awayTeam?.name ?? "TBD"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {m.matchDate ? formatDateTime(m.matchDate) : "Not scheduled"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {m.venue?.name ?? "TBD"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {m.assignment?.referee?.user?.name ?? (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge label={MATCH_STATUS_META[m.status]?.label ?? m.status} color={MATCH_STATUS_META[m.status]?.color ?? "secondary"} dot />
                          {m.resultStatus !== "NONE" && (
                            <StatusBadge label={RESULT_STATUS_META[m.resultStatus]?.label ?? m.resultStatus} color={RESULT_STATUS_META[m.resultStatus]?.color ?? "secondary"} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <EditMatchDialog
                            tournamentId={id}
                            matchId={m.id}
                            matchCode={m.matchCode}
                            matchDate={m.matchDate?.toISOString() ?? null}
                            venueId={m.venueId}
                            round={m.round}
                            venues={venues}
                          />
                          <AssignRefereeDialog
                            tournamentId={id}
                            matchId={m.id}
                            matchCode={m.matchCode}
                            currentRefereeId={m.assignment?.refereeId ?? null}
                            referees={refereeList}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
