"use client";

import { useState, useMemo } from "react";
import { SubmitResultForm, type MatchData, type PlayerOpt } from "./submit-result-form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/page-elements";
import { formatDateTime } from "@/lib/helpers";

export type PendingMatch = {
  id: string;
  matchCode: string | null;
  matchDate: string | null;
  status: string;
  resultStatus: string;
  homeScore: number;
  awayScore: number;
  homeRuns: number | null;
  homeWickets: number | null;
  homeOvers: string | null;
  awayRuns: number | null;
  awayWickets: number | null;
  awayOvers: string | null;
  playerOfMatch: string | null;
  notes: string | null;
  tournament: { id: string; name: string; sport: string };
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  venue: { id: string; name: string } | null;
};

export type TeamPlayers = Record<string, PlayerOpt[]>; // teamId -> players

export function SubmitResultPicker({
  pendingMatches,
  teamPlayers,
  initialMatchId,
}: {
  pendingMatches: PendingMatch[];
  teamPlayers: TeamPlayers;
  initialMatchId?: string;
}) {
  const [matchId, setMatchId] = useState<string>(initialMatchId ?? pendingMatches[0]?.id ?? "");

  const selected = useMemo(
    () => pendingMatches.find((m) => m.id === matchId) ?? null,
    [pendingMatches, matchId]
  );

  if (pendingMatches.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No matches to submit"
        description="You have no scheduled/live matches awaiting a result. Check back after your next assignment."
      />
    );
  }

  // Build a MatchData shape from the pending match
  const matchData: MatchData | null = selected
    ? {
        id: selected.id,
        matchCode: selected.matchCode,
        homeScore: selected.homeScore,
        awayScore: selected.awayScore,
        homeRuns: selected.homeRuns,
        homeWickets: selected.homeWickets,
        homeOvers: selected.homeOvers,
        awayRuns: selected.awayRuns,
        awayWickets: selected.awayWickets,
        awayOvers: selected.awayOvers,
        playerOfMatch: selected.playerOfMatch,
        notes: selected.notes,
        resultStatus: selected.resultStatus,
        status: selected.status,
        tournament: selected.tournament,
        homeTeam: selected.homeTeam,
        awayTeam: selected.awayTeam,
        venue: selected.venue,
      }
    : null;

  const homePlayers = selected?.homeTeam ? teamPlayers[selected.homeTeam.id] ?? [] : [];
  const awayPlayers = selected?.awayTeam ? teamPlayers[selected.awayTeam.id] ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <Label htmlFor="match-select">Select Match</Label>
        <Select value={matchId} onValueChange={setMatchId}>
          <SelectTrigger id="match-select" className="w-full"><SelectValue placeholder="Choose a match" /></SelectTrigger>
          <SelectContent>
            {pendingMatches.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"} — {m.matchDate ? formatDateTime(m.matchDate) : "TBD"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && (
          <p className="text-xs text-muted-foreground">
            {selected.tournament.name} · {selected.matchCode ?? "no code"} · status: {selected.status}
          </p>
        )}
      </div>

      {matchData && (
        <SubmitResultForm match={matchData} homePlayers={homePlayers} awayPlayers={awayPlayers} />
      )}
    </div>
  );
}
