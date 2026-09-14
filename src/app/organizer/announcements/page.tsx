import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Pin } from "lucide-react";
import { relativeTime, formatDateTime } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function OrganizerAnnouncementsPage() {
  const session = await getSession();
  if (!session) return null;

  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });

  const tournamentIds = prof
    ? (await db.tournament.findMany({ where: { organizerId: prof.id }, select: { id: true, name: true } })).map((t) => ({ id: t.id, name: t.name }))
    : [];
  const ids = tournamentIds.map((t) => t.id);

  const announcements = ids.length
    ? await db.announcement.findMany({
        where: { tournamentId: { in: ids } },
        include: { author: { select: { name: true } } },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 100,
      })
    : [];

  const tournamentMap = new Map(tournamentIds.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="All announcements you've published across your tournaments."
      />

      <Card>
        <CardContent className="p-0">
          {announcements.length === 0 ? (
            <EmptyState icon={Megaphone} title="No announcements" description="Publish updates from a tournament's announcements tab." />
          ) : (
            <div className="max-h-[75vh] divide-y overflow-y-auto scrollbar-thin">
              {announcements.map((a) => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    {a.pinned && <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        by {a.author?.name ?? "—"} · {relativeTime(a.createdAt)} · {formatDateTime(a.createdAt)}
                        {a.tournamentId && (
                          <> · in <Link href={`/organizer/tournaments/${a.tournamentId}/announcements`} className="hover:text-primary">{tournamentMap.get(a.tournamentId)}</Link></>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
