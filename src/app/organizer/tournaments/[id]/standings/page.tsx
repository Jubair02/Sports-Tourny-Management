import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { BarChart3, Trophy, Medal } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });
  const tournament = await db.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, organizerId: true, sport: true, winPoints: true, drawPoints: true, lossPoints: true, format: true },
  });
  if (!tournament) notFound();
  if (session.role !== "ADMIN" && (!prof || prof.id !== tournament.organizerId)) notFound();

  const standings = await db.standing.findMany({
    where: { tournamentId: id },
    include: { team: true },
    orderBy: [{ points: "desc" }, { goalsFor: "desc" }, { won: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Link href={`/organizer/tournaments/${id}`} className="text-muted-foreground hover:text-foreground">Tournaments</Link>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span>Standings</span>
          </> as any
        }
        description={`Live points table for ${tournament.name}. Updated automatically when results are approved.`}
      />

      <Card>
        <CardContent className="p-0">
          {standings.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No standings yet"
              description="Standings are generated when round-robin fixtures are created and matches are completed."
            />
          ) : (
            <div className="max-h-[75vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">W</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">D</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">L</TableHead>
                    <TableHead className="text-center hidden md:table-cell">
                      {tournament.sport === "CRICKET" ? "Runs For" : "GF"}
                    </TableHead>
                    <TableHead className="text-center hidden md:table-cell">
                      {tournament.sport === "CRICKET" ? "Runs Against" : "GA"}
                    </TableHead>
                    <TableHead className="text-center hidden lg:table-cell">GD</TableHead>
                    <TableHead className="text-center">Pts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((s, i) => (
                    <TableRow key={s.id} className={i < 3 ? "bg-emerald-500/5" : undefined}>
                      <TableCell className="font-mono text-xs">
                        {i === 0 ? <Medal className="h-4 w-4 text-amber-500" /> : i === 1 ? <Medal className="h-4 w-4 text-muted-foreground" /> : i === 2 ? <Medal className="h-4 w-4 text-orange-500" /> : i + 1}
                      </TableCell>
                      <TableCell>
                        <p className="truncate text-sm font-medium">{s.team.name}</p>
                      </TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{s.played}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums hidden sm:table-cell">{s.won}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums hidden sm:table-cell">{s.drawn}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums hidden sm:table-cell">{s.lost}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums hidden md:table-cell">{s.goalsFor}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums hidden md:table-cell">{s.goalsAgainst}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums hidden lg:table-cell">
                        {s.goalsFor - s.goalsAgainst > 0 ? "+" : ""}{s.goalsFor - s.goalsAgainst}
                      </TableCell>
                      <TableCell className="text-center text-sm font-bold tabular-nums text-primary">{s.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Scoring: <strong className="text-foreground">Win = {tournament.winPoints} pts</strong> ·
            <strong className="text-foreground">Draw = {tournament.drawPoints} pts</strong> ·
            <strong className="text-foreground">Loss = {tournament.lossPoints} pts</strong>
            <span className="ml-2">(adjust in Settings)</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
