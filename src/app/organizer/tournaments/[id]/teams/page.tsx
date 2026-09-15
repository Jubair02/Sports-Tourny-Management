import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MapPin, Phone, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });
  const tournament = await db.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, organizerId: true, maxTeams: true, minTeams: true },
  });
  if (!tournament) notFound();
  if (session.role !== "ADMIN" && (!prof || prof.id !== tournament.organizerId)) notFound();

  const participants = await db.tournamentParticipant.findMany({
    where: { tournamentId: id },
    include: {
      team: {
        include: {
          manager: { include: { user: true } },
          _count: { select: { players: true } },
        },
      },
    },
    orderBy: { team: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Link href={`/organizer/tournaments/${id}`} className="text-muted-foreground hover:text-foreground">Tournaments</Link>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span>Teams</span>
          </> as any
        }
        description={`${participants.length} approved teams · max ${tournament.maxTeams}.`}
      />

      {participants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No approved teams yet"
          description="Approve team registrations to see them here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {participants.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                    {p.team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.team.captain ? `Captain: ${p.team.captain}` : "Captain TBD"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Manager: {p.team.manager?.user?.name ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {p.team._count.players} players
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {p.team.district ?? "—"}
                  </div>
                  {p.team.phone && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="truncate">{p.team.phone}</span>
                    </div>
                  )}
                  {p.team.email && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{p.team.email}</span>
                    </div>
                  )}
                </div>
                {p.team.description && (
                  <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{p.team.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
