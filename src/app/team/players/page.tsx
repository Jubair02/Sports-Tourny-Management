import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getTeamManagerProfile } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Users } from "lucide-react";
import { formatDate } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function AllPlayersPage() {
  const session = await getSession();
  let profile = session ? await getTeamManagerProfile(session.id) : null;
  if (!profile && session?.role === "ADMIN") {
    profile = await db.teamManagerProfile.findFirst({ include: { user: true } });
  }

  const teams = profile
    ? await db.team.findMany({
        where: { managerId: profile.id },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      })
    : [];
  const teamIds = teams.map((t) => t.id);
  const teamNameMap = new Map(teams.map((t) => [t.id, t.name]));

  const players = teamIds.length
    ? await db.player.findMany({
        where: { teamId: { in: teamIds } },
        orderBy: [{ teamId: "asc" }, { jerseyNumber: "asc" }, { name: "asc" }],
      })
    : [];

  const verified = players.filter((p) => p.verificationStatus === "VERIFIED").length;
  const pending = players.filter((p) => p.verificationStatus === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Players"
        description="All players across your teams."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Players</p>
          <p className="text-2xl font-bold tabular-nums">{players.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Verified</p>
          <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{verified}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{pending}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {players.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No players yet"
                description="Create a team first, then add players to your squad."
                action={<Link href="/team/teams" className="text-sm text-primary hover:underline">Go to My Teams</Link>}
              />
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="hidden md:table-cell">Position</TableHead>
                    <TableHead className="hidden lg:table-cell">DOB</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((p) => (
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
                      <TableCell>
                        <Link
                          href={`/team/teams/${teams.find((t) => t.id === p.teamId)?.id ?? ""}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {teamNameMap.get(p.teamId) ?? "—"}
                        </Link>
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
