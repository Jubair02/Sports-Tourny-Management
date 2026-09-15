"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ROLE_LABELS } from "@/lib/nav";
import { formatDateTime, relativeTime } from "@/lib/helpers";

type Log = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string } | null;
};

export function AuditLogsTable({
  logs,
  pagination,
  currentQ,
}: {
  logs: Log[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  currentQ: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(currentQ);
  const [pending, startTransition] = useTransition();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams(sp.toString());
      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");
      params.delete("page");
      router.push(`/admin/audit-logs?${params.toString()}`);
    });
  };

  const goPage = (newPage: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(newPage));
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submitSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by action, detail, entity, user…"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={pending} variant="default">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </form>

      <div className="rounded-lg border">
        <div className="max-h-[65vh] overflow-y-auto scrollbar-thin">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Entity</TableHead>
                <TableHead className="hidden lg:table-cell">Detail</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{log.user?.name ?? "System"}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {log.user ? ROLE_LABELS[log.user.role] ?? log.user.role : "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={log.action.replace(/_/g, " ")} color="secondary" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {log.entity ?? "—"}
                      {log.entityId && (
                        <span className="ml-1 font-mono text-[10px] text-muted-foreground/70">
                          ({log.entityId.slice(-6)})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-md truncate">
                      {log.detail ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground" title={formatDateTime(log.createdAt)}>
                      {relativeTime(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => goPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => goPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
