import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserActions } from "@/components/admin/user-actions";
import { ROLE_LABELS } from "@/lib/nav";
import { formatDate } from "@/lib/helpers";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "rose",
  ORGANIZER: "amber",
  TEAM_MANAGER: "blue",
  REFEREE: "teal",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const sp = await searchParams;
  const role = sp.role;

  const users = await db.user.findMany({
    where: role ? { role } : undefined,
    include: {
      organizerProfile: true,
      teamManagerProfile: true,
      refereeProfile: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const roleCounts = await db.user.groupBy({
    by: ["role"],
    _count: { _all: true },
  });
  const countMap: Record<string, number> = {};
  roleCounts.forEach((r) => (countMap[r.role] = r._count._all));
  const total = Object.entries(countMap).reduce((acc, [k, v]) => (k === "PUBLIC" ? acc : acc + v), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="All platform accounts — organizers, team managers, referees, and admins."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/users">
          <StatusBadge label={`All (${total})`} color={!role ? "primary" : "secondary"} />
        </Link>
        {(Object.keys(ROLE_LABELS) as string[]).filter((r) => r !== "PUBLIC").map((r) => (
          <Link key={r} href={`/admin/users?role=${r}`}>
            <StatusBadge
              label={`${ROLE_LABELS[r]} (${countMap[r] ?? 0})`}
              color={role === r ? "primary" : "secondary"}
            />
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <EmptyState title="No users" description="No users match this filter." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const isPendingOrganizer =
                      u.role === ROLES.ORGANIZER &&
                      u.organizerProfile?.approvalStatus === "PENDING";
                    return (
                      <TableRow key={u.id} className={isPendingOrganizer ? "bg-amber-500/5" : undefined}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary">
                              {u.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{u.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge label={ROLE_LABELS[u.role] ?? u.role} color={ROLE_COLOR[u.role] ?? "secondary"} />
                          {isPendingOrganizer && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                              Pending approval
                            </span>
                          )}
                          {u.role === ROLES.ORGANIZER && u.organizerProfile?.organization && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {u.organizerProfile.organization}
                            </p>
                          )}
                          {u.role === ROLES.TEAM_MANAGER && u.teamManagerProfile?.district && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {u.teamManagerProfile.district}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {u.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={u.status === "ACTIVE" ? "Active" : "Suspended"}
                            color={u.status === "ACTIVE" ? "emerald" : "destructive"}
                            dot
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <UserActions
                            userId={u.id}
                            currentStatus={u.status}
                            organizerProfileId={u.organizerProfile?.id}
                            isPendingOrganizer={isPendingOrganizer}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
