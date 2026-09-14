"use client";

import Link from "next/link";
import { SportBadge } from "@/components/shared/sport-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDateTime, formatDate } from "@/lib/helpers";
import { MATCH_STATUS_META, RESULT_STATUS_META } from "@/lib/constants";
import { ArrowRight, Clock, MapPin, Trophy } from "lucide-react";

type MatchRow = {
  id: string;
  matchCode: string | null;
  status: string;
  resultStatus: string;
  matchDate: string | null;
  homeScore: number;
  awayScore: number;
  homeRuns: number | null;
  homeWickets: number | null;
  awayRuns: number | null;
  awayWickets: number | null;
  playerOfMatch: string | null;
  tournament: { id: string; name: string; sport: string };
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  venue: { id: string; name: string } | null;
};

function MatchRowItem({ m }: { m: MatchRow }) {
  const matchMeta = MATCH_STATUS_META[m.status] ?? { label: m.status, color: "secondary" };
  const resultMeta = RESULT_STATUS_META[m.resultStatus] ?? { label: m.resultStatus, color: "secondary" };
  const isFootballLike = m.tournament.sport === "FOOTBALL" || m.tournament.sport === "FUTSAL";
  return (
    <Link
      href={`/referee/matches/${m.id}`}
      className="block rounded-lg border p-3 transition-colors hover:bg-accent/60"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SportBadge sport={m.tournament.sport} />
          <StatusBadge label={matchMeta.label} color={matchMeta.color} dot />
          {m.resultStatus !== "NONE" && <StatusBadge label={resultMeta.label} color={resultMeta.color} />}
        </div>
        <span className="text-[10px] text-muted-foreground">{m.tournament.name}</span>
      </div>
      <p className="mt-1 text-sm font-medium">
        {m.homeTeam?.name ?? "TBD"} <span className="text-muted-foreground">vs</span> {m.awayTeam?.name ?? "TBD"}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {m.matchDate && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDateTime(m.matchDate)}
          </span>
        )}
        {m.venue?.name && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {m.venue.name}
          </span>
        )}
        {isFootballLike && m.status === "COMPLETED" && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono tabular-nums">{m.homeScore} - {m.awayScore}</span>
        )}
        {!isFootballLike && m.status === "COMPLETED" && m.homeRuns != null && m.awayRuns != null && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono tabular-nums">
            {m.homeRuns}/{m.homeWickets} vs {m.awayRuns}/{m.awayWickets}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-end">
        <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          {m.status === "COMPLETED" ? "View / Edit Result" : "Open & Submit"} <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

export function RefereeMatchesTabs({
  upcoming,
  today,
  completed,
}: {
  upcoming: MatchRow[];
  today: MatchRow[];
  completed: MatchRow[];
}) {
  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
        <TabsTrigger value="today">Today ({today.length})</TabsTrigger>
        <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming" className="space-y-3 mt-3">
        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No upcoming matches assigned to you.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((m) => <MatchRowItem key={m.id} m={m} />)}
          </div>
        )}
      </TabsContent>
      <TabsContent value="today" className="space-y-3 mt-3">
        {today.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No matches scheduled for today.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {today.map((m) => <MatchRowItem key={m.id} m={m} />)}
          </div>
        )}
      </TabsContent>
      <TabsContent value="completed" className="space-y-3 mt-3">
        {completed.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No completed matches yet.
          </div>
        ) : (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto scrollbar-thin pr-1">
            <div className="grid gap-3 sm:grid-cols-2">
              {completed.map((m) => <MatchRowItem key={m.id} m={m} />)}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
