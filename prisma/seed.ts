// Seed script: rich Bangladesh-focused demo data
// Run: bun prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const DAYS = 24 * 60 * 60 * 1000;
const now = new Date();

async function main() {
  console.log("Clearing existing data...");
  // Delete in dependency order
  await db.matchEvent.deleteMany();
  await db.refereeAssignment.deleteMany();
  await db.match.deleteMany();
  await db.standing.deleteMany();
  await db.tournamentParticipant.deleteMany();
  await db.tournamentRegistration.deleteMany();
  await db.player.deleteMany();
  await db.team.deleteMany();
  await db.venue.deleteMany();
  await db.tournament.deleteMany();
  await db.announcement.deleteMany();
  await db.dispute.deleteMany();
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.organizerProfile.deleteMany();
  await db.teamManagerProfile.deleteMany();
  await db.refereeProfile.deleteMany();
  await db.user.deleteMany();

  console.log("Creating users...");
  // ── Admin ──
  const admin = await db.user.create({
    data: {
      email: "admin@tourney.bd",
      passwordHash: hashPassword("admin123"),
      name: "Arif Hossain",
      phone: "+8801711000001",
      role: "ADMIN",
    },
  });

  // ── Organizers ──
  const orgUser1 = await db.user.create({
    data: {
      email: "jubair@mirpursports.bd",
      passwordHash: hashPassword("organ123"),
      name: "Jubair Ahmed",
      phone: "+8801711000002",
      role: "ORGANIZER",
    },
  });
  const organizer1 = await db.organizerProfile.create({
    data: {
      userId: orgUser1.id,
      organization: "Mirpur Sports Association",
      phone: "+8801711000002",
      district: "Dhaka",
      approvalStatus: "APPROVED",
      bio: "Organizing community football & cricket tournaments across Mirpur since 2015.",
    },
  });

  const orgUser2 = await db.user.create({
    data: {
      email: "rina@uttarafc.bd",
      passwordHash: hashPassword("organ123"),
      name: "Rina Akter",
      phone: "+8801711000003",
      role: "ORGANIZER",
    },
  });
  const organizer2 = await db.organizerProfile.create({
    data: {
      userId: orgUser2.id,
      organization: "Uttara Sports Club",
      phone: "+8801711000003",
      district: "Dhaka",
      approvalStatus: "PENDING",
      bio: "Upcoming organizer focused on women's sports and youth leagues.",
    },
  });

  // ── Team Managers ──
  const tmUsers: { user: any; profile: any }[] = [];
  const tmData = [
    { email: "rahim@dhakawarriors.bd", name: "Rahim Uddin", phone: "+8801711000010", district: "Dhaka" },
    { email: "kamal@mirpurfc.bd", name: "Kamal Hossain", phone: "+8801711000011", district: "Dhaka" },
    { email: "sumon@chattogramtigers.bd", name: "Sumon Barua", phone: "+8801711000012", district: "Chattogram" },
    { email: "faisal@bananiblazers.bd", name: "Faisal Rahman", phone: "+8801711000013", district: "Dhaka" },
  ];
  for (const t of tmData) {
    const u = await db.user.create({
      data: {
        email: t.email,
        passwordHash: hashPassword("manage123"),
        name: t.name,
        phone: t.phone,
        role: "TEAM_MANAGER",
      },
    });
    const p = await db.teamManagerProfile.create({
      data: { userId: u.id, phone: t.phone, district: t.district },
    });
    tmUsers.push({ user: u, profile: p });
  }

  // ── Referees ──
  const refUsers: { user: any; profile: any }[] = [];
  const refData = [
    { email: "ref.rahman@tourney.bd", name: "Referee Rahman", phone: "+8801711000020", spec: "Football", district: "Dhaka" },
    { email: "ref.karim@tourney.bd", name: "Referee Karim", phone: "+8801711000021", spec: "Cricket", district: "Chattogram" },
    { email: "ref.sabbir@tourney.bd", name: "Referee Sabbir", phone: "+8801711000022", spec: "Football", district: "Dhaka" },
  ];
  for (const r of refData) {
    const u = await db.user.create({
      data: {
        email: r.email,
        passwordHash: hashPassword("refer123"),
        name: r.name,
        phone: r.phone,
        role: "REFEREE",
      },
    });
    const p = await db.refereeProfile.create({
      data: { userId: u.id, phone: r.phone, district: r.district, specialization: r.spec, rating: 4.5 },
    });
    refUsers.push({ user: u, profile: p });
  }

  console.log("Creating venues...");
  const venues = await Promise.all([
    db.venue.create({
      data: {
        name: "Mirpur Bangla College Ground",
        division: "Dhaka", district: "Dhaka", upazila: "Mirpur",
        address: "Block C, Mirpur, Dhaka", capacity: 2000,
        facilities: JSON.stringify(["Floodlight", "Parking", "Canteen", "Changing Room"]),
        image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=70",
      },
    }),
    db.venue.create({
      data: {
        name: "Uttara Sector 4 Playground",
        division: "Dhaka", district: "Gazipur", upazila: "Uttara",
        address: "Sector 4, Uttara, Dhaka", capacity: 1500,
        facilities: JSON.stringify(["Parking", "Canteen"]),
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=70",
      },
    }),
    db.venue.create({
      data: {
        name: "Dhanmondi Cricket Ground",
        division: "Dhaka", district: "Dhaka", upazila: "Dhanmondi",
        address: "Dhanmondi, Dhaka", capacity: 3000,
        facilities: JSON.stringify(["Floodlight", "Pavilion", "Scoreboard", "Parking"]),
        image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=70",
      },
    }),
    db.venue.create({
      data: {
        name: "Banani Army Stadium",
        division: "Dhaka", district: "Dhaka", upazila: "Banani",
        address: "Banani, Dhaka", capacity: 5000,
        facilities: JSON.stringify(["Floodlight", "Pavilion", "Parking", "Canteen", "First Aid"]),
        image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=70",
      },
    }),
    db.venue.create({
      data: {
        name: "Chittagong MA Aziz Stadium",
        division: "Chittagong", district: "Chattogram", upazila: "Double Mooring",
        address: "Patenga Road, Chattogram", capacity: 18000,
        facilities: JSON.stringify(["Floodlight", "Pavilion", "Scoreboard", "Parking", "Press Box"]),
        image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=70",
      },
    }),
    db.venue.create({
      data: {
        name: "Mirpur Indoor Stadium",
        division: "Dhaka", district: "Dhaka", upazila: "Mirpur",
        address: "Mirpur 10, Dhaka", capacity: 2500,
        facilities: JSON.stringify(["Indoor", "Floodlight", "Parking", "Canteen"]),
        image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=70",
      },
    }),
  ]);

  console.log("Creating teams & players...");
  const teamDefs = [
    { name: "Dhaka Warriors", district: "Dhaka", managerIdx: 0, captain: "Rahim Uddin", sport: "FOOTBALL" },
    { name: "Mirpur FC", district: "Dhaka", managerIdx: 1, captain: "Kamal Hossain", sport: "FOOTBALL" },
    { name: "Uttara United", district: "Dhaka", managerIdx: 0, captain: "Sajjad Ali", sport: "FOOTBALL" },
    { name: "Banani Blasters", district: "Dhaka", managerIdx: 3, captain: "Faisal Rahman", sport: "FOOTBALL" },
    { name: "Chattogram Tigers", district: "Chattogram", managerIdx: 2, captain: "Sumon Barua", sport: "CRICKET" },
    { name: "Dhaka Dynamos CC", district: "Dhaka", managerIdx: 2, captain: "Imran Khan", sport: "CRICKET" },
    { name: "Mirpur Rovers", district: "Dhaka", managerIdx: 1, captain: "Jewel Mia", sport: "FOOTBALL" },
    { name: "Gulshan Strikers", district: "Dhaka", managerIdx: 3, captain: "Nayeem Islam", sport: "FOOTBALL" },
  ];

  const teams: any[] = [];
  const footballNames = ["Rahim", "Karim", "Hasan", "Sakib", "Tamim", "Nasir", "Rubel", "Mashrafi", "Mehedi", "Liton", "Soumya", "Afif"];
  const cricketNames = ["Tamim Iqbal", "Shakib Al Hasan", "Mushfiqur Rahim", "Mahmudullah", "Litton Das", "Taskin Ahmed", "Mustafizur Rahman", "Najmul Shanto"];
  let teamIdx = 0;
  for (const td of teamDefs) {
    const mgr = tmUsers[td.managerIdx];
    const team = await db.team.create({
      data: {
        name: td.name,
        slug: slugify(td.name),
        captain: td.captain,
        managerId: mgr.profile.id,
        phone: "+88017" + (11000000 + teamIdx * 137),
        email: `info@${slugify(td.name)}.bd`,
        district: td.district,
        address: `${td.district}, Bangladesh`,
        description: `${td.name} — a community ${td.sport.toLowerCase()} team from ${td.district}.`,
      },
    });
    teams.push(team);
    // Add players
    const positions = td.sport === "CRICKET"
      ? ["BATTER", "BOWLER", "ALLROUNDER", "WICKETKEEPER", "BATTER", "BOWLER", "ALLROUNDER", "BATTER"]
      : ["GOALKEEPER", "DEFENDER", "DEFENDER", "MIDFIELDER", "MIDFIELDER", "FORWARD", "FORWARD", "DEFENDER"];
    const names = td.sport === "CRICKET" ? cricketNames : footballNames;
    for (let i = 0; i < 8; i++) {
      const verified = i < 6 ? "VERIFIED" : "PENDING";
      await db.player.create({
        data: {
          teamId: team.id,
          name: `${names[i % names.length]} ${td.name.split(" ")[0]}`,
          jerseyNumber: i === 0 ? 1 : (i + 1) * 2 - 1,
          position: positions[i],
          verificationStatus: verified,
          dateOfBirth: new Date(1995 + (i % 8), i % 12, (i % 27) + 1),
          phone: "+88017" + (11000000 + teamIdx * 137 + i),
          nidReference: verified === "VERIFIED" ? `NID-${10000 + teamIdx * 10 + i}` : null,
        },
      });
    }
    teamIdx++;
  }

  console.log("Creating tournaments...");
  // ── Tournament 1: Ongoing Football League (Round Robin) ──
  const t1 = await db.tournament.create({
    data: {
      name: "Mirpur Community Football League 2025",
      slug: slugify("Mirpur Community Football League 2025"),
      sport: "FOOTBALL",
      description:
        "The flagship community football league of Mirpur, featuring 8 local clubs battling over 4 weeks for the championship trophy. Organized by Mirpur Sports Association.",
      organizerId: organizer1.id,
      venueId: venues[0].id,
      division: "Dhaka", district: "Dhaka", upazila: "Mirpur",
      location: "Mirpur, Dhaka",
      startDate: new Date(now.getTime() - 7 * DAYS),
      endDate: new Date(now.getTime() + 21 * DAYS),
      regStart: new Date(now.getTime() - 30 * DAYS),
      regDeadline: new Date(now.getTime() - 10 * DAYS),
      entryFee: 5000,
      maxTeams: 8,
      minTeams: 4,
      format: "ROUND_ROBIN",
      ageCategory: "OPEN",
      gender: "MALE",
      category: "COMMUNITY",
      rules: "11-a-side, 90 minutes, standard FIFA rules. Win = 3 pts, Draw = 1 pt.",
      prizeMoney: "৳1,00,000",
      status: "ONGOING",
      winPoints: 3, drawPoints: 1, lossPoints: 0,
    },
  });

  // ── Tournament 2: Registration Open Cricket ──
  const t2 = await db.tournament.create({
    data: {
      name: "Dhanmondi T20 Cricket Cup 2025",
      slug: slugify("Dhanmondi T20 Cricket Cup 2025"),
      sport: "CRICKET",
      description:
        "A premier T20 tape-ball cricket tournament open to clubs across Dhaka. 8-team group + knockout format with prize money of ৳2,00,000.",
      organizerId: organizer1.id,
      venueId: venues[2].id,
      division: "Dhaka", district: "Dhaka", upazila: "Dhanmondi",
      location: "Dhanmondi, Dhaka",
      startDate: new Date(now.getTime() + 14 * DAYS),
      endDate: new Date(now.getTime() + 35 * DAYS),
      regStart: new Date(now.getTime() - 5 * DAYS),
      regDeadline: new Date(now.getTime() + 7 * DAYS),
      entryFee: 8000,
      maxTeams: 8,
      minTeams: 4,
      format: "GROUP_KNOCKOUT",
      ageCategory: "OPEN",
      gender: "MALE",
      category: "CLUB",
      rules: "T20, tape ball, 6 overs powerplay. Standard BCB rules.",
      prizeMoney: "৳2,00,000",
      status: "REGISTRATION_OPEN",
      winPoints: 2, drawPoints: 1, lossPoints: 0,
    },
  });

  // ── Tournament 3: Completed Futsal ──
  const t3 = await db.tournament.create({
    data: {
      name: "Uttara Futsal Championship 2024",
      slug: slugify("Uttara Futsal Championship 2024"),
      sport: "FUTSAL",
      description:
        "Indoor 5-a-side futsal tournament held at Uttara Indoor Arena. The 2024 edition concluded with Banani Blasters crowned champions.",
      organizerId: organizer1.id,
      venueId: venues[1].id,
      division: "Dhaka", district: "Gazipur", upazila: "Uttara",
      location: "Uttara, Dhaka",
      startDate: new Date(now.getTime() - 60 * DAYS),
      endDate: new Date(now.getTime() - 40 * DAYS),
      regStart: new Date(now.getTime() - 90 * DAYS),
      regDeadline: new Date(now.getTime() - 65 * DAYS),
      entryFee: 3000,
      maxTeams: 6,
      minTeams: 4,
      format: "SINGLE_ELIMINATION",
      ageCategory: "YOUTH",
      gender: "MALE",
      category: "COMMUNITY",
      rules: "5-a-side futsal, 40 minutes (2x20).",
      prizeMoney: "৳50,000",
      status: "COMPLETED",
      winPoints: 3, drawPoints: 1, lossPoints: 0,
    },
  });

  // ── Tournament 4: Pending approval ──
  const t4 = await db.tournament.create({
    data: {
      name: "Dhaka Corporate Badminton Open",
      slug: slugify("Dhaka Corporate Badminton Open"),
      sport: "BADMINTON",
      description:
        "Inter-corporate badminton championship for companies based in Dhaka. Singles & doubles events.",
      organizerId: organizer1.id,
      venueId: venues[5].id,
      division: "Dhaka", district: "Dhaka", upazila: "Mirpur",
      location: "Mirpur, Dhaka",
      startDate: new Date(now.getTime() + 30 * DAYS),
      endDate: new Date(now.getTime() + 33 * DAYS),
      regStart: new Date(now.getTime() + 3 * DAYS),
      regDeadline: new Date(now.getTime() + 25 * DAYS),
      entryFee: 2000,
      maxTeams: 16,
      minTeams: 8,
      format: "SINGLE_ELIMINATION",
      ageCategory: "OPEN",
      gender: "MIXED",
      category: "CORPORATE",
      rules: "Best of 3 games to 21. BWF rules.",
      prizeMoney: "৳30,000",
      status: "PENDING_APPROVAL",
      winPoints: 3, drawPoints: 1, lossPoints: 0,
    },
  });

  console.log("Creating registrations, participants, matches, standings...");
  // Tournament 1 registrations & participants — 6 football teams
  const footballTeams = teams.filter((t) => t.name !== "Chattogram Tigers" && t.name !== "Dhaka Dynamos CC").slice(0, 6);
  for (let i = 0; i < footballTeams.length; i++) {
    const team = footballTeams[i];
    await db.tournamentRegistration.create({
      data: {
        tournamentId: t1.id,
        teamId: team.id,
        status: "APPROVED",
        paymentMethod: i % 2 === 0 ? "BKASH" : "CASH",
        paymentStatus: "VERIFIED",
        paymentRef: i % 2 === 0 ? `TX${1000 + i}` : null,
        registeredAt: new Date(now.getTime() - (25 - i) * DAYS),
      },
    });
    await db.tournamentParticipant.create({
      data: { tournamentId: t1.id, teamId: team.id, seed: i + 1 },
    });
    await db.standing.create({
      data: { tournamentId: t1.id, teamId: team.id, group: null },
    });
  }

  // Tournament 2 — cricket registrations (mixed statuses)
  const cricketTeams = teams.filter((t) => t.name === "Chattogram Tigers" || t.name === "Dhaka Dynamos CC");
  const t2Teams = [...cricketTeams, ...footballTeams.slice(0, 3)];
  for (let i = 0; i < t2Teams.length; i++) {
    const status = i < 2 ? "APPROVED" : i < 4 ? "PENDING" : "REJECTED";
    await db.tournamentRegistration.create({
      data: {
        tournamentId: t2.id,
        teamId: t2Teams[i].id,
        status,
        rejectionReason: status === "REJECTED" ? "Incomplete player documents" : null,
        paymentMethod: i % 2 === 0 ? "NAGAD" : "BKASH",
        paymentStatus: status === "APPROVED" ? "VERIFIED" : "PENDING",
        registeredAt: new Date(now.getTime() - (4 - (i % 5)) * DAYS),
      },
    });
    if (status === "APPROVED") {
      await db.tournamentParticipant.create({
        data: { tournamentId: t2.id, teamId: t2Teams[i].id, seed: i + 1 },
      });
    }
  }

  // Tournament 3 — completed futsal (4 teams)
  const t3Teams = footballTeams.slice(0, 4);
  for (const team of t3Teams) {
    await db.tournamentRegistration.create({
      data: { tournamentId: t3.id, teamId: team.id, status: "APPROVED", paymentStatus: "VERIFIED", paymentMethod: "CASH", registeredAt: new Date(now.getTime() - 80 * DAYS) },
    });
    await db.tournamentParticipant.create({ data: { tournamentId: t3.id, teamId: team.id } });
  }

  console.log("Generating fixtures & results for Tournament 1 (round robin)...");
  // Round-robin matches among 6 teams — generate a subset with results
  const rr = footballTeams;
  const matches: { homeIdx: number; awayIdx: number }[] = [];
  for (let i = 0; i < rr.length; i++) {
    for (let j = i + 1; j < rr.length; j++) {
      matches.push({ homeIdx: i, awayIdx: j });
    }
  }
  // Assign referee to first referee profile
  const ref1 = refUsers[0].profile;
  const ref3 = refUsers[2].profile;
  let matchCounter = 0;
  for (let m = 0; m < matches.length; m++) {
    const { homeIdx, awayIdx } = matches[m];
    const home = rr[homeIdx];
    const away = rr[awayIdx];
    const completed = m < 8; // first 8 completed
    const date = new Date(now.getTime() - (7 - m) * DAYS + m * 3 * 60 * 60 * 1000);
    const venue = venues[m % 2 === 0 ? 0 : 3];
    const homeScore = completed ? (2 + ((m * 3) % 3)) : 0;
    const awayScore = completed ? ((m * 2) % 4) : 0;
    const match = await db.match.create({
      data: {
        matchCode: `M${String(m + 1).padStart(3, "0")}`,
        tournamentId: t1.id,
        round: "GROUP",
        homeTeamId: home.id,
        awayTeamId: away.id,
        venueId: venue.id,
        refereeId: m % 2 === 0 ? ref1.id : ref3.id,
        matchDate: completed ? new Date(now.getTime() - (8 - m) * DAYS) : new Date(now.getTime() + (m - 7) * DAYS),
        status: completed ? "COMPLETED" : "SCHEDULED",
        homeScore,
        awayScore,
        resultStatus: completed ? "APPROVED" : "NONE",
        winnerTeamId: completed ? (homeScore > awayScore ? home.id : awayScore > homeScore ? away.id : null) : null,
      },
    });
    if (m % 2 === 0 && match.refereeId) {
      await db.refereeAssignment.create({
        data: { refereeId: ref1.id, matchId: match.id },
      });
    } else if (match.refereeId) {
      await db.refereeAssignment.create({
        data: { refereeId: ref3.id, matchId: match.id },
      });
    }
    if (completed) {
      // Update standings
      const hs = await db.standing.findFirst({ where: { tournamentId: t1.id, teamId: home.id } });
      const as = await db.standing.findFirst({ where: { tournamentId: t1.id, teamId: away.id } });
      if (hs && as) {
        await db.standing.update({
          where: { id: hs.id },
          data: {
            played: { increment: 1 },
            won: { increment: homeScore > awayScore ? 1 : 0 },
            drawn: { increment: homeScore === awayScore ? 1 : 0 },
            lost: { increment: homeScore < awayScore ? 1 : 0 },
            goalsFor: { increment: homeScore },
            goalsAgainst: { increment: awayScore },
            points: { increment: homeScore > awayScore ? 3 : homeScore === awayScore ? 1 : 0 },
          },
        });
        await db.standing.update({
          where: { id: as.id },
          data: {
            played: { increment: 1 },
            won: { increment: awayScore > homeScore ? 1 : 0 },
            drawn: { increment: homeScore === awayScore ? 1 : 0 },
            lost: { increment: awayScore < homeScore ? 1 : 0 },
            goalsFor: { increment: awayScore },
            goalsAgainst: { increment: homeScore },
            points: { increment: awayScore > homeScore ? 3 : homeScore === awayScore ? 1 : 0 },
          },
        });
      }
    }
    matchCounter++;
  }

  console.log("Generating completed futsal bracket for Tournament 3...");
  // Single elimination — 2 semis + final, all completed
  const fTeams = t3Teams;
  // Semi 1: team0 vs team1
  const sf1 = await db.match.create({
    data: {
      matchCode: "SF1", tournamentId: t3.id, round: "SEMI_FINAL",
      homeTeamId: fTeams[0].id, awayTeamId: fTeams[1].id,
      venueId: venues[1].id, matchDate: new Date(now.getTime() - 45 * DAYS),
      status: "COMPLETED", homeScore: 3, awayScore: 1, resultStatus: "APPROVED",
      winnerTeamId: fTeams[0].id,
    },
  });
  const sf2 = await db.match.create({
    data: {
      matchCode: "SF2", tournamentId: t3.id, round: "SEMI_FINAL",
      homeTeamId: fTeams[2].id, awayTeamId: fTeams[3].id,
      venueId: venues[1].id, matchDate: new Date(now.getTime() - 44 * DAYS),
      status: "COMPLETED", homeScore: 2, awayScore: 4, resultStatus: "APPROVED",
      winnerTeamId: fTeams[3].id,
    },
  });
  const final = await db.match.create({
    data: {
      matchCode: "FIN", tournamentId: t3.id, round: "FINAL",
      homeTeamId: fTeams[0].id, awayTeamId: fTeams[3].id,
      venueId: venues[1].id, matchDate: new Date(now.getTime() - 40 * DAYS),
      status: "COMPLETED", homeScore: 2, awayScore: 3, resultStatus: "APPROVED",
      winnerTeamId: fTeams[3].id, playerOfMatch: "Faisal Rahman",
    },
  });

  console.log("Creating announcements...");
  await db.announcement.create({
    data: {
      tournamentId: t1.id, authorId: orgUser1.id,
      title: "Match Day 3 Schedule Released",
      content: "Round 3 fixtures have been published. Check the fixtures tab for your match time and venue. Players must arrive 30 minutes before kick-off.",
      pinned: true,
    },
  });
  await db.announcement.create({
    data: {
      tournamentId: t1.id, authorId: orgUser1.id,
      title: "Floodlight Maintenance Notice",
      content: "Mirpur Bangla College Ground floodlights will be serviced on matchday eve. Evening matches may shift by 30 minutes.",
    },
  });
  await db.announcement.create({
    data: {
      tournamentId: t2.id, authorId: orgUser1.id,
      title: "Registration Open — Dhanmondi T20 Cup",
      content: "Registrations are now open! Limited to 8 teams. Entry fee ৳8,000 via bKash/Nagad. Deadline in 7 days.",
      pinned: true,
    },
  });

  console.log("Creating notifications...");
  // Notify team managers about registration statuses
  await db.notification.create({
    data: { userId: tmUsers[0].user.id, title: "Registration Approved", message: "Dhaka Warriors has been approved for Mirpur Community Football League 2025.", type: "REGISTRATION", link: "/team/tournaments" },
  });
  await db.notification.create({
    data: { userId: tmUsers[0].user.id, title: "Upcoming Match", message: "Your next match is tomorrow at 4:00 PM at Mirpur Bangla College Ground.", type: "MATCH", link: "/team/fixtures" },
  });
  await db.notification.create({
    data: { userId: refUsers[0].user.id, title: "Referee Assignment", message: "You have been assigned to Match M001 — Dhaka Warriors vs Mirpur FC.", type: "MATCH", link: "/referee/matches" },
  });
  await db.notification.create({
    data: { userId: orgUser1.id, title: "Pending Approvals", message: "2 new team registrations awaiting your review for Dhanmondi T20 Cricket Cup.", type: "REGISTRATION", link: "/organizer/tournaments" },
  });
  await db.notification.create({
    data: { userId: admin.id, title: "Organizer Approval", message: "Rina Akter (Uttara Sports Club) has applied for organizer approval.", type: "SYSTEM", link: "/admin/users" },
  });

  console.log("Creating disputes & audit logs...");
  await db.dispute.create({
    data: {
      tournamentId: t1.id, matchId: null, raisedById: tmUsers[1].user.id,
      type: "REFEREE_ISSUE", title: "Questionable offside call in Match M002",
      description: "The referee disallowed a clear goal in the second half of our match against Uttara United. Requesting review.",
      status: "OPEN",
    },
  });
  await db.dispute.create({
    data: {
      tournamentId: t1.id, raisedById: tmUsers[0].user.id,
      type: "FIXTURE_ISSUE", title: "Short rest between matches",
      description: "Our team has back-to-back matches with only 18 hours gap. Requesting reschedule.",
      status: "UNDER_REVIEW",
    },
  });

  await db.auditLog.create({
    data: { userId: admin.id, action: "APPROVED_ORGANIZER", entity: "OrganizerProfile", entityId: organizer1.id, detail: "Approved organizer: Jubair Ahmed (Mirpur Sports Association)" },
  });
  await db.auditLog.create({
    data: { userId: orgUser1.id, action: "TOURNAMENT_STATUS_CHANGED", entity: "Tournament", entityId: t1.id, detail: "Status changed to ONGOING" },
  });
  await db.auditLog.create({
    data: { userId: refUsers[0].user.id, action: "RESULT_SUBMITTED", entity: "Match", detail: "Submitted result for Match M001" },
  });
  await db.auditLog.create({
    data: { userId: orgUser1.id, action: "RESULT_APPROVED", entity: "Match", detail: "Approved Match M001 result — standings updated" },
  });

  console.log("✅ Seed complete!");
  console.log("\n── Demo Logins ──────────────────────────────");
  console.log("Admin      admin@tourney.bd / admin123");
  console.log("Organizer  jubair@mirpursports.bd / organ123");
  console.log("Manager    rahim@dhakawarriors.bd / manage123");
  console.log("Referee    ref.rahman@tourney.bd / refer123");
  console.log("─────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
