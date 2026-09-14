import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-elements";
import { AnnouncementManager } from "@/components/admin/announcement-manager";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const [announcements, tournaments] = await Promise.all([
    db.announcement.findMany({
      include: {
        author: { select: { id: true, name: true, email: true } },
        tournament: { select: { id: true, name: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    db.tournament.findMany({
      where: { status: { in: ["PUBLISHED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);

  const serializable = announcements.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Publish platform-wide or tournament-specific announcements."
      />
      <AnnouncementManager announcements={serializable} tournaments={tournaments} />
    </div>
  );
}
