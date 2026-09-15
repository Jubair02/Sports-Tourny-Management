import { db } from "./db";

// Recompute standings for a tournament from scratch based on APPROVED, COMPLETED matches.
// For round-robin / group stages. For knockout, standings aren't used the same way.
export async function recalcStandings(tournamentId: string) {
  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return;
  const matches = await db.match.findMany({
    where: {
      tournamentId,
      status: "COMPLETED",
      resultStatus: "APPROVED",
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
  });
  const participants = await db.tournamentParticipant.findMany({ where: { tournamentId } });
  const teamIds = new Set(participants.map((p) => p.teamId));
  // reset
  await db.standing.deleteMany({ where: { tournamentId } });
  // create base
  const standings: Record<string, any> = {};
  for (const tid of teamIds) {
    standings[tid] = { tournamentId, teamId: tid, group: null, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
  }
  for (const m of matches) {
    const h = m.homeTeamId!;
    const a = m.awayTeamId!;
    if (!standings[h] || !standings[a]) continue;
    const isCricket = tournament.sport === "CRICKET";
    const hs = isCricket ? (m.homeRuns ?? 0) : m.homeScore;
    const as = isCricket ? (m.awayRuns ?? 0) : m.awayScore;
    standings[h].played += 1;
    standings[a].played += 1;
    standings[h].goalsFor += hs;
    standings[h].goalsAgainst += as;
    standings[a].goalsFor += as;
    standings[a].goalsAgainst += hs;
    if (hs > as) {
      standings[h].won += 1;
      standings[a].lost += 1;
      standings[h].points += tournament.winPoints;
      standings[a].points += tournament.lossPoints;
    } else if (hs < as) {
      standings[a].won += 1;
      standings[h].lost += 1;
      standings[a].points += tournament.winPoints;
      standings[h].points += tournament.lossPoints;
    } else {
      standings[h].drawn += 1;
      standings[a].drawn += 1;
      standings[h].points += tournament.drawPoints;
      standings[a].points += tournament.drawPoints;
    }
  }
  await db.standing.createMany({
    data: Object.values(standings),
  });
}

// Generate a single-elimination bracket from a list of participant teamIds.
// Creates matches with placeholder team slots if needed (bye handling: if odd, last team gets a bye).
export async function generateSingleElimination(tournamentId: string, teamIds: string[], venueId?: string) {
  const count = teamIds.length;
  if (count < 2) return { matches: 0, round: "ROUND_1" };
  // Determine rounds
  const rounds: string[] = [];
  if (count > 32) rounds.push("ROUND_64");
  if (count > 16) rounds.push("ROUND_32");
  if (count > 8) rounds.push("ROUND_16");
  if (count > 4) rounds.push("QUARTER_FINAL");
  if (count > 2) rounds.push("SEMI_FINAL");
  rounds.push("FINAL");
  const firstRound = rounds[0];

  const matches: { home: string; away: string | null }[] = [];
  let i = 0;
  while (i < count) {
    const home = teamIds[i];
    const away = i + 1 < count ? teamIds[i + 1] : null;
    matches.push({ home, away });
    i += 2;
  }
  let code = 1;
  for (const m of matches) {
    await db.match.create({
      data: {
        matchCode: `M${String(code).padStart(3, "0")}`,
        tournamentId,
        round: firstRound,
        homeTeamId: m.home,
        awayTeamId: m.away ?? undefined,
        venueId: venueId ?? undefined,
        status: m.away ? "SCHEDULED" : "COMPLETED",
        resultStatus: m.away ? "NONE" : "APPROVED",
        winnerTeamId: m.away ? undefined : m.home,
      },
    });
    code++;
  }
  return { matches: matches.length, round: firstRound };
}

// Generate round-robin fixtures: each team plays every other once.
export async function generateRoundRobin(tournamentId: string, teamIds: string[], venueId?: string) {
  const matches: { home: string; away: string }[] = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({ home: teamIds[i], away: teamIds[j] });
    }
  }
  // stagger dates starting tomorrow, 1 per day (simplified)
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1);
  baseDate.setHours(16, 0, 0, 0);
  let code = 1;
  for (const m of matches) {
    const date = new Date(baseDate.getTime() + (code - 1) * 24 * 60 * 60 * 1000);
    await db.match.create({
      data: {
        matchCode: `M${String(code).padStart(3, "0")}`,
        tournamentId,
        round: "GROUP",
        homeTeamId: m.home,
        awayTeamId: m.away,
        venueId: venueId ?? undefined,
        matchDate: date,
        status: "SCHEDULED",
      },
    });
    code++;
  }
  // create empty standings rows (one per team)
  for (const tid of teamIds) {
    const existing = await db.standing.findFirst({ where: { tournamentId, teamId: tid, group: null } });
    if (!existing) {
      await db.standing.create({ data: { tournamentId, teamId: tid, group: null } });
    }
  }
  return { matches: matches.length, round: "GROUP" };
}

// Generate group + knockout. Split into groups of ~4, round-robin within, then knockout placeholders.
export async function generateGroupKnockout(tournamentId: string, teamIds: string[], venueId?: string) {
  const groupSize = 4;
  const groups: string[][] = [];
  for (let i = 0; i < teamIds.length; i += groupSize) {
    groups.push(teamIds.slice(i, i + groupSize));
  }
  const groupLabels = ["A", "B", "C", "D", "E", "F"];
  let code = 1;
  for (let g = 0; g < groups.length; g++) {
    const label = groupLabels[g] ?? `G${g}`;
    const teams = groups[g];
    // participants group tagging handled by caller; here we create matches
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const date = new Date();
        date.setDate(date.getDate() + code);
        date.setHours(15, 0, 0, 0);
        await db.match.create({
          data: {
            matchCode: `M${String(code).padStart(3, "0")}`,
            tournamentId,
            round: "GROUP",
            group: label,
            homeTeamId: teams[i],
            awayTeamId: teams[j],
            venueId: venueId ?? undefined,
            matchDate: date,
            status: "SCHEDULED",
          },
        });
        code++;
      }
    }
  }
  // Create knockout placeholders (semis + final) without teams assigned yet
  await db.match.create({ data: { matchCode: `SF1`, tournamentId, round: "SEMI_FINAL", venueId: venueId ?? undefined } });
  await db.match.create({ data: { matchCode: `SF2`, tournamentId, round: "SEMI_FINAL", venueId: venueId ?? undefined } });
  await db.match.create({ data: { matchCode: `FIN`, tournamentId, round: "FINAL", venueId: venueId ?? undefined } });
  return { matches: code - 1 + 3, round: "GROUP" };
}
