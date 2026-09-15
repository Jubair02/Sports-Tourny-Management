import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Pin } from "lucide-react";
import { AnnouncementForm, DeleteAnnouncementButton } from "@/components/organizer/announcement-form";
import { formatDateTime, relativeTime } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const prof = session.role === "ADMIN"
    ? await db.organizerProfile.findFirst({ where: { approvalStatus: "APPROVED" } })
    : await db.organizerProfile.findUnique({ where: { userId: session.id } });
  const tournament = await db.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, organizerId: true },
  });
  if (!tournament) notFound();
  if (session.role !== "ADMIN" && (!prof || prof.id !== tournament.organizerId)) notFound();

  const announcements = await db.announcement.findMany({
    where: { tournamentId: id },
    include: { author: { select: { name: true } } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Link href={`/organizer/tournaments/${id}`} className="text-muted-foreground hover:text-foreground">Tournaments</Link>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span>Announcements</span>
          </> as any
        }
        description={`Publish updates to teams playing in ${tournament.name}.`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-primary" />
              New Announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementForm tournamentId={id} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Published ({announcements.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {announcements.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={Megaphone} title="No announcements yet" description="Publish tournament updates and they'll appear here." />
              </div>
            ) : (
              <div className="max-h-[60vh] divide-y overflow-y-auto scrollbar-thin">
                {announcements.map((a) => (
                  <div key={a.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {a.pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                          <p className="font-medium">{a.title}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{a.content}</p>
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          by {a.author?.name ?? "—"} · {relativeTime(a.createdAt)} · {formatDateTime(a.createdAt)}
                        </p>
                      </div>
                      <DeleteAnnouncementButton tournamentId={id} annId={a.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
