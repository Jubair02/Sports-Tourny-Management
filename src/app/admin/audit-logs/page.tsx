import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-elements";
import { AuditLogsTable } from "@/components/admin/audit-logs-table";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q || undefined;
  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(sp.pageSize || "20", 10)));

  const where: any = {};
  if (q) {
    where.OR = [
      { action: { contains: q } },
      { detail: { contains: q } },
      { entity: { contains: q } },
      { user: { name: { contains: q } } },
      { user: { email: { contains: q } } },
    ];
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
  ]);

  const serializable = logs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Every important platform change is logged here for full traceability."
      />
      <AuditLogsTable
        logs={serializable}
        pagination={{ page, pageSize, total, totalPages: Math.ceil(total / pageSize) }}
        currentQ={q ?? ""}
      />
    </div>
  );
}
