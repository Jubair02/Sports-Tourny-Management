"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Megaphone, Loader2, Send, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function AnnouncementForm({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/organizer/tournaments/${tournamentId}/announcements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, pinned }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to publish announcement");
          return;
        }
        toast.success("Announcement published");
        setTitle(""); setContent(""); setPinned(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="ann-title">Title</Label>
        <Input id="ann-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Schedule update / Match postponed" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ann-content">Content</Label>
        <Textarea id="ann-content" required rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write the announcement details…" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={pinned} onCheckedChange={(v) => setPinned(Boolean(v))} />
        <Pin className="h-3.5 w-3.5" />
        Pin this announcement
      </label>
      <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Publish
      </Button>
    </form>
  );
}

export function DeleteAnnouncementButton({ tournamentId, annId }: { tournamentId: string; annId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const del = () => {
    if (!confirm("Delete this announcement?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/organizer/tournaments/${tournamentId}/announcements/${annId}`, { method: "DELETE" });
        if (!res.ok) {
          const d = await res.json();
          toast.error(d.error || "Failed");
          return;
        }
        toast.success("Announcement deleted");
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };
  return (
    <Button variant="ghost" size="sm" className="h-7 text-destructive hover:bg-destructive/5" disabled={pending} onClick={del}>
      Delete
    </Button>
  );
}
