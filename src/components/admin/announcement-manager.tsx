"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Megaphone, Pin, Loader2, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, relativeTime } from "@/lib/helpers";

type Announcement = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  tournament: { id: string; name: string } | null;
  author: { id: string; name: string; email: string } | null;
};

type Tournament = { id: string; name: string };

export function AnnouncementManager({
  announcements,
  tournaments,
}: {
  announcements: Announcement[];
  tournaments: Tournament[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tournamentId, setTournamentId] = useState("__none__");
  const [pinned, setPinned] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content required");
      return;
    }
    startTransition(async () => {
      try {
        const payload: any = { title, content, pinned };
        if (tournamentId !== "__none__") payload.tournamentId = tournamentId;
        const res = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed");
          return;
        }
        toast.success("Announcement published");
        setTitle("");
        setContent("");
        setTournamentId("__none__");
        setPinned(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  const remove = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Failed");
          return;
        }
        toast.success("Announcement deleted");
        router.refresh();
      } catch {
        toast.error("Network error");
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">New Announcement</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Schedule change for Friday matches" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your announcement…" rows={5} />
            </div>
            <div className="space-y-2">
              <Label>Tournament (optional)</Label>
              <Select value={tournamentId} onValueChange={setTournamentId}>
                <SelectTrigger><SelectValue placeholder="Select tournament…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Platform-wide —</SelectItem>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={pinned} onCheckedChange={(v) => setPinned(Boolean(v))} />
              <Pin className="h-3.5 w-3.5 text-amber-500" />
              Pin to top
            </label>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-2 p-0">
          <div className="border-b p-4">
            <h3 className="font-semibold">Published Announcements ({announcements.length})</h3>
          </div>
          {announcements.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto scrollbar-thin p-4">
              {announcements.map((a) => (
                <div key={a.id} className={`rounded-lg border p-3 ${a.pinned ? "border-amber-500/40 bg-amber-500/5" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                        <h4 className="truncate font-medium">{a.title}</h4>
                        {a.tournament ? (
                          <StatusBadge label={a.tournament.name} color="blue" />
                        ) : (
                          <StatusBadge label="Platform-wide" color="secondary" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{a.content}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground" title={formatDateTime(a.createdAt)}>
                        by {a.author?.name ?? "Unknown"} · {relativeTime(a.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/5"
                      disabled={pending && busyId === a.id}
                      onClick={() => remove(a.id)}
                    >
                      {pending && busyId === a.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
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
