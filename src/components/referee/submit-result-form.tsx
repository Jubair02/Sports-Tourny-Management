"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Save, Plus, Trash2, ArrowRight, Flag, Goal, ShieldAlert,
  Activity, ArrowLeftRight, CheckCircle2, Clock, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SportBadge } from "@/components/shared/sport-badge";

export type PlayerOpt = { id: string; name: string; jerseyNumber?: number | null };
export type MatchData = {
  id: string;
  matchCode: string | null;
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
  resultStatus: string;
  status: string;
  tournament: { id: string; name: string; sport: string };
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  venue: { id: string; name: string } | null;
};

type EventType = "GOAL" | "YELLOW" | "RED" | "SUB";
type EventRow = {
  id: string;
  type: EventType;
  teamId: string;
  playerId: string;
  minute: number;
  note: string;
};

const EVENT_TYPES: { value: EventType; label: string; icon: any; color: string }[] = [
  { value: "GOAL", label: "Goal", icon: Goal, color: "emerald" },
  { value: "YELLOW", label: "Yellow Card", icon: ShieldAlert, color: "amber" },
  { value: "RED", label: "Red Card", icon: ShieldAlert, color: "destructive" },
  { value: "SUB", label: "Substitution", icon: ArrowLeftRight, color: "blue" },
];

const EVENT_LABELS: Record<EventType, string> = {
  GOAL: "Goal",
  YELLOW: "Yellow",
  RED: "Red",
  SUB: "Sub",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function SubmitResultForm({
  match,
  homePlayers,
  awayPlayers,
}: {
  match: MatchData;
  homePlayers: PlayerOpt[];
  awayPlayers: PlayerOpt[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isCricket = match.tournament.sport === "CRICKET";
  const isFootballLike = match.tournament.sport === "FOOTBALL" || match.tournament.sport === "FUTSAL";

  // Football state
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);
  const [events, setEvents] = useState<EventRow[]>([]);

  // Cricket state
  const [homeRuns, setHomeRuns] = useState(match.homeRuns ?? 0);
  const [homeWickets, setHomeWickets] = useState(match.homeWickets ?? 0);
  const [homeOvers, setHomeOvers] = useState(match.homeOvers ?? "");
  const [awayRuns, setAwayRuns] = useState(match.awayRuns ?? 0);
  const [awayWickets, setAwayWickets] = useState(match.awayWickets ?? 0);
  const [awayOvers, setAwayOvers] = useState(match.awayOvers ?? "");

  // Common state
  const [playerOfMatch, setPlayerOfMatch] = useState(match.playerOfMatch ?? "");
  const [notes, setNotes] = useState(match.notes ?? "");

  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const teamOptions = useMemo(() => {
    const opts: { id: string; name: string }[] = [];
    if (homeTeam) opts.push(homeTeam);
    if (awayTeam) opts.push(awayTeam);
    return opts;
  }, [homeTeam, awayTeam]);

  const playersByTeam = useMemo(() => {
    const map = new Map<string, PlayerOpt[]>();
    if (homeTeam) map.set(homeTeam.id, homePlayers);
    if (awayTeam) map.set(awayTeam.id, awayPlayers);
    return map;
  }, [homeTeam, awayTeam, homePlayers, awayPlayers]);

  const addEvent = () => {
    const firstTeam = teamOptions[0];
    setEvents((cur) => [
      ...cur,
      { id: uid(), type: "GOAL", teamId: firstTeam?.id ?? "", playerId: "", minute: 1, note: "" },
    ]);
  };
  const removeEvent = (id: string) => setEvents((cur) => cur.filter((e) => e.id !== id));
  const updateEvent = (id: string, patch: Partial<EventRow>) =>
    setEvents((cur) => cur.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  // Cricket winner calc
  const cricketWinner = useMemo(() => {
    if (!isCricket) return null;
    const h = Number(homeRuns) || 0;
    const a = Number(awayRuns) || 0;
    if (h > a) return homeTeam?.id ?? null;
    if (a > h) return awayTeam?.id ?? null;
    return null; // tie
  }, [isCricket, homeRuns, awayRuns, homeTeam, awayTeam]);

  const alreadySubmitted = match.resultStatus === "SUBMITTED";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCricket) {
      if (homeOvers && !/^\d+(\.\d{1,2})?$/.test(homeOvers)) {
        toast.error("Home overs must look like 18.4");
        return;
      }
      if (awayOvers && !/^\d+(\.\d{1,2})?$/.test(awayOvers)) {
        toast.error("Away overs must look like 18.4");
        return;
      }
    }

    startTransition(async () => {
      try {
        const payload: any = {
          matchId: match.id,
          playerOfMatch: playerOfMatch.trim() || undefined,
          notes: notes.trim() || undefined,
        };
        if (isFootballLike) {
          payload.homeScore = Number(homeScore) || 0;
          payload.awayScore = Number(awayScore) || 0;
          payload.winnerTeamId =
            payload.homeScore > payload.awayScore ? homeTeam?.id :
            payload.awayScore > payload.homeScore ? awayTeam?.id : null;
          payload.events = events
            .filter((ev) => ev.teamId && ev.playerId)
            .map((ev) => ({
              type: ev.type,
              teamId: ev.teamId,
              playerId: ev.playerId,
              minute: Number(ev.minute) || 0,
              note: ev.note.trim() || undefined,
            }));
        } else if (isCricket) {
          payload.homeRuns = Number(homeRuns) || 0;
          payload.homeWickets = Number(homeWickets) || 0;
          payload.homeOvers = homeOvers || null;
          payload.awayRuns = Number(awayRuns) || 0;
          payload.awayWickets = Number(awayWickets) || 0;
          payload.awayOvers = awayOvers || null;
          payload.winnerTeamId = cricketWinner;
        }

        const res = await fetch(`/api/referee/matches/${match.id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to submit result");
          return;
        }
        toast.success("Result submitted for organizer approval");
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Workflow banner */}
      <div className="rounded-lg border bg-gradient-to-r from-emerald-500/10 to-amber-500/10 p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Flag className="h-3.5 w-3.5" /> You submit
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" /> Pending organizer confirmation
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Official result
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Your submission is saved as <strong>SUBMITTED</strong> — only the organizer can mark it official.
        </p>
      </div>

      {/* Live score header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <SportBadge sport={match.tournament.sport} />
              <span className="text-xs font-normal text-muted-foreground">{match.tournament.name}</span>
            </span>
            <StatusBadge label={match.resultStatus === "SUBMITTED" ? "Submitted" : "Awaiting result"} color={match.resultStatus === "SUBMITTED" ? "amber" : "secondary"} dot />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scoreline */}
          {isFootballLike && (
            <div className="grid grid-cols-3 items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Home</p>
                <p className="text-sm font-semibold sm:text-base">{homeTeam?.name ?? "TBD"}</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(Number(e.target.value))}
                  className="h-14 w-16 text-center text-3xl font-bold tabular-nums"
                />
                <span className="text-xl text-muted-foreground">—</span>
                <Input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(Number(e.target.value))}
                  className="h-14 w-16 text-center text-3xl font-bold tabular-nums"
                />
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Away</p>
                <p className="text-sm font-semibold sm:text-base">{awayTeam?.name ?? "TBD"}</p>
              </div>
            </div>
          )}

          {isCricket && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">{homeTeam?.name ?? "Home"} (innings)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]" htmlFor="hr">Runs</Label>
                    <Input id="hr" type="number" min="0" value={homeRuns} onChange={(e) => setHomeRuns(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]" htmlFor="hw">Wkt</Label>
                    <Input id="hw" type="number" min="0" max="10" value={homeWickets} onChange={(e) => setHomeWickets(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]" htmlFor="ho">Overs</Label>
                    <Input id="ho" placeholder="18.4" value={homeOvers} onChange={(e) => setHomeOvers(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{homeRuns ?? 0}/{homeWickets ?? 0} ({homeOvers || "0"} ov)</p>
              </div>
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">{awayTeam?.name ?? "Away"} (innings)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]" htmlFor="ar">Runs</Label>
                    <Input id="ar" type="number" min="0" value={awayRuns} onChange={(e) => setAwayRuns(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]" htmlFor="aw">Wkt</Label>
                    <Input id="aw" type="number" min="0" max="10" value={awayWickets} onChange={(e) => setAwayWickets(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]" htmlFor="ao">Overs</Label>
                    <Input id="ao" placeholder="18.4" value={awayOvers} onChange={(e) => setAwayOvers(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{awayRuns ?? 0}/{awayWickets ?? 0} ({awayOvers || "0"} ov)</p>
              </div>
              <div className="sm:col-span-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                {cricketWinner ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Winner (auto): {cricketWinner === homeTeam?.id ? homeTeam?.name : awayTeam?.name}
                  </span>
                ) : (
                  <span>Tied or no winner yet</span>
                )}
              </div>
            </div>
          )}

          {/* Match notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Match notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Weather, delays, controversies, etc." />
          </div>
        </CardContent>
      </Card>

      {/* Football events builder */}
      {isFootballLike && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" /> Match Events
            </CardTitle>
            <Button type="button" size="sm" variant="outline" className="h-8" onClick={addEvent}>
              <Plus className="h-3.5 w-3.5" /> Add Event
            </Button>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No events added. Click "Add Event" to record goals, cards, substitutions.
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => {
                  const players = playersByTeam.get(ev.teamId) ?? [];
                  return (
                    <div key={ev.id} className="grid grid-cols-1 gap-2 rounded-md border p-2 sm:grid-cols-[110px_1fr_1fr_70px_36px] sm:items-end">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Type</Label>
                        <Select value={ev.type} onValueChange={(v) => updateEvent(ev.id, { type: v as EventType })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {EVENT_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Team</Label>
                        <Select value={ev.teamId} onValueChange={(v) => updateEvent(ev.id, { teamId: v, playerId: "" })}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Team" /></SelectTrigger>
                          <SelectContent>
                            {teamOptions.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Player</Label>
                        <Select value={ev.playerId} onValueChange={(v) => updateEvent(ev.id, { playerId: v })} disabled={!ev.teamId}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select player" /></SelectTrigger>
                          <SelectContent>
                            {players.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                #{p.jerseyNumber ?? "—"} {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Min</Label>
                        <Input type="number" min="0" max="130" className="h-8" value={ev.minute} onChange={(e) => updateEvent(ev.id, { minute: Number(e.target.value) })} />
                      </div>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-9 text-destructive" onClick={() => removeEvent(ev.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
                <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                  {events.filter((e) => e.type === "GOAL").length} goal event(s) · {events.length} total
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Player of the match + notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-amber-500" /> Player of the Match & Notes
          </CardTitle>
          <CardDescription>Optional but recommended.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="pom">Player of the Match (name)</Label>
            <Input id="pom" value={playerOfMatch} onChange={(e) => setPlayerOfMatch(e.target.value)} placeholder="e.g. Mashrafe Mortaza" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-stretch justify-end gap-2 sm:flex-row sm:items-center">
        {alreadySubmitted && (
          <p className="flex-1 text-xs text-amber-600 dark:text-amber-400">
            You already submitted a result. Re-submitting will overwrite your previous submission (still requires organizer approval).
          </p>
        )}
        <Button type="submit" disabled={pending} className="sm:w-auto">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Submit Result
        </Button>
      </div>
    </form>
  );
}
