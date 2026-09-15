import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Flag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganizerRefereesPage() {
  const session = await getSession();
  if (!session) return null;

  const referees = await db.refereeProfile.findMany({
    include: {
      user: true,
      _count: { select: { assignments: true } },
    },
    orderBy: { user: { name: "asc" } },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referees"
        description="Directory of registered referees available for assignment."
      />

      <Card>
        <CardContent className="p-0">
          {referees.length === 0 ? (
            <EmptyState icon={Flag} title="No referees registered" description="Referees will appear here once they register on the platform." />
          ) : (
            <div className="max-h-[75vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Specialization</TableHead>
                    <TableHead className="hidden md:table-cell">District</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="text-center">Assignments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referees.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {r.user.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium">{r.user.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{r.user.email}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {r.specialization ? <StatusBadge label={r.specialization} color="secondary" /> : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{r.district ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">{r.user.phone ?? "—"}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{r._count.assignments}</TableCell>
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
