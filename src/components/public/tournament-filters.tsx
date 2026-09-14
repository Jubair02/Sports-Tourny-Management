"use client";

import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SPORTS_LIST,
  SPORT_META,
  TOURNAMENT_STATUS,
  TOURNAMENT_STATUS_META,
  TOURNAMENT_CATEGORIES,
  CATEGORY_META,
} from "@/lib/constants";

export function TournamentFilters({
  current,
}: {
  current: { q?: string; sport?: string; status?: string; category?: string };
}) {
  const router = useRouter();

  const update = (key: string, value?: string) => {
    const sp = new URLSearchParams();
    if (current.q) sp.set("q", current.q);
    if (current.sport) sp.set("sport", current.sport);
    if (current.status) sp.set("status", current.status);
    if (current.category) sp.set("category", current.category);
    if (value && value !== "all") sp.set(key, value);
    else sp.delete(key);
    const qs = sp.toString();
    router.push(`/tournaments${qs ? `?${qs}` : ""}`);
  };

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    update("q", (fd.get("q") as string) || "all");
  };

  const hasAny = Boolean(current.q || current.sport || current.status || current.category);

  return (
    <div className="space-y-3">
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search tournaments, organisers, locations…"
            defaultValue={current.q ?? ""}
            className="pl-8"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={current.sport ?? "all"} onValueChange={(v) => update("sport", v)}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="All sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sports</SelectItem>
            {SPORTS_LIST.map((s) => (
              <SelectItem key={s} value={s}>
                {SPORT_META[s]?.emoji} {SPORT_META[s]?.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={current.status ?? "all"} onValueChange={(v) => update("status", v)}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {Object.values(TOURNAMENT_STATUS).map((s) => (
              <SelectItem key={s} value={s}>
                {TOURNAMENT_STATUS_META[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={current.category ?? "all"} onValueChange={(v) => update("category", v)}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Any category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any category</SelectItem>
            {Object.values(TOURNAMENT_CATEGORIES).map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_META[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasAny && (
          <Button variant="ghost" size="sm" onClick={() => router.push("/tournaments")}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
