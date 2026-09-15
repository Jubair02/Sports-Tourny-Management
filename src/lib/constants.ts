// Platform-wide constants & enums (string-based for SQLite compatibility)

export const ROLES = {
  ADMIN: "ADMIN",
  ORGANIZER: "ORGANIZER",
  TEAM_MANAGER: "TEAM_MANAGER",
  REFEREE: "REFEREE",
  PUBLIC: "PUBLIC",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const SPORTS = {
  FOOTBALL: "FOOTBALL",
  CRICKET: "CRICKET",
  FUTSAL: "FUTSAL",
  BADMINTON: "BADMINTON",
  BASKETBALL: "BASKETBALL",
  VOLLEYBALL: "VOLLEYBALL",
  TABLE_TENNIS: "TABLE_TENNIS",
  ESPORTS: "ESPORTS",
} as const;

export type Sport = (typeof SPORTS)[keyof typeof SPORTS];

export const SPORT_META: Record<
  string,
  { label: string; icon: string; emoji: string; color: string }
> = {
  FOOTBALL: { label: "Football", icon: "CircleDot", emoji: "⚽", color: "emerald" },
  CRICKET: { label: "Cricket", icon: "Target", emoji: "🏏", color: "amber" },
  FUTSAL: { label: "Futsal", icon: "Goal", emoji: "🥅", color: "teal" },
  BADMINTON: { label: "Badminton", icon: "Shuttlecock", emoji: "🏸", color: "rose" },
  BASKETBALL: { label: "Basketball", icon: "Dribbble", emoji: "🏀", color: "orange" },
  VOLLEYBALL: { label: "Volleyball", icon: "Volleyball", emoji: "🏐", color: "cyan" },
  TABLE_TENNIS: { label: "Table Tennis", icon: "Circle", emoji: "🏓", color: "violet" },
  ESPORTS: { label: "Esports", icon: "Gamepad2", emoji: "🎮", color: "fuchsia" },
};

export const TOURNAMENT_STATUS = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  PUBLISHED: "PUBLISHED",
  REGISTRATION_OPEN: "REGISTRATION_OPEN",
  REGISTRATION_CLOSED: "REGISTRATION_CLOSED",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const TOURNAMENT_STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  DRAFT: { label: "Draft", color: "secondary" },
  PENDING_APPROVAL: { label: "Pending Approval", color: "amber" },
  PUBLISHED: { label: "Published", color: "blue" },
  REGISTRATION_OPEN: { label: "Registration Open", color: "emerald" },
  REGISTRATION_CLOSED: { label: "Registration Closed", color: "amber" },
  ONGOING: { label: "Ongoing", color: "emerald" },
  COMPLETED: { label: "Completed", color: "secondary" },
  CANCELLED: { label: "Cancelled", color: "destructive" },
};

export const TOURNAMENT_FORMATS = {
  SINGLE_ELIMINATION: "SINGLE_ELIMINATION",
  ROUND_ROBIN: "ROUND_ROBIN",
  GROUP_KNOCKOUT: "GROUP_KNOCKOUT",
} as const;

export const FORMAT_META: Record<string, { label: string; desc: string }> = {
  SINGLE_ELIMINATION: { label: "Single Elimination", desc: "Knockout — lose once and you're out." },
  ROUND_ROBIN: { label: "Round Robin", desc: "Every team plays every other team." },
  GROUP_KNOCKOUT: { label: "Group Stage + Knockout", desc: "Groups then quarter/semi/final." },
};

export const TOURNAMENT_CATEGORIES = {
  SCHOOL: "SCHOOL",
  COLLEGE: "COLLEGE",
  UNIVERSITY: "UNIVERSITY",
  CORPORATE: "CORPORATE",
  CLUB: "CLUB",
  LOCAL: "LOCAL",
  DISTRICT: "DISTRICT",
  COMMUNITY: "COMMUNITY",
} as const;

export const CATEGORY_META: Record<string, string> = {
  SCHOOL: "School Tournament",
  COLLEGE: "College Tournament",
  UNIVERSITY: "University Tournament",
  CORPORATE: "Corporate Tournament",
  CLUB: "Club Tournament",
  LOCAL: "Local / Area Tournament",
  DISTRICT: "District Tournament",
  COMMUNITY: "Community Tournament",
};

export const REGISTRATION_STATUS = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const REG_STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "amber" },
  UNDER_REVIEW: { label: "Under Review", color: "blue" },
  APPROVED: { label: "Approved", color: "emerald" },
  REJECTED: { label: "Rejected", color: "destructive" },
};

export const MATCH_STATUS = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const MATCH_STATUS_META: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Scheduled", color: "secondary" },
  LIVE: { label: "Live", color: "destructive" },
  COMPLETED: { label: "Completed", color: "emerald" },
  CANCELLED: { label: "Cancelled", color: "secondary" },
};

export const RESULT_STATUS = {
  NONE: "NONE",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const RESULT_STATUS_META: Record<string, { label: string; color: string }> = {
  NONE: { label: "No Result", color: "secondary" },
  SUBMITTED: { label: "Submitted", color: "amber" },
  APPROVED: { label: "Official", color: "emerald" },
  REJECTED: { label: "Rejected", color: "destructive" },
};

export const PLAYER_VERIFICATION = {
  VERIFIED: "VERIFIED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
} as const;

export const PAYMENT_METHODS = {
  CASH: "CASH",
  BKASH: "BKASH",
  NAGAD: "NAGAD",
  ROCKET: "ROCKET",
  ONLINE: "ONLINE",
} as const;

export const PAYMENT_METHOD_META: Record<string, { label: string; emoji: string }> = {
  CASH: { label: "Cash", emoji: "💵" },
  BKASH: { label: "bKash", emoji: "📱" },
  NAGAD: { label: "Nagad", emoji: "📲" },
  ROCKET: { label: "Rocket", emoji: "🚀" },
  ONLINE: { label: "Online", emoji: "💳" },
};

export const PAYMENT_STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "amber" },
  PAID: { label: "Paid", color: "blue" },
  VERIFIED: { label: "Verified", color: "emerald" },
  REFUNDED: { label: "Refunded", color: "secondary" },
};

export const ORGANIZER_APPROVAL = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const DISPUTE_TYPES = {
  WRONG_RESULT: "WRONG_RESULT",
  PLAYER_ELIGIBILITY: "PLAYER_ELIGIBILITY",
  REFEREE_ISSUE: "REFEREE_ISSUE",
  FIXTURE_ISSUE: "FIXTURE_ISSUE",
  OTHER: "OTHER",
} as const;

export const DISPUTE_TYPE_META: Record<string, string> = {
  WRONG_RESULT: "Wrong Result",
  PLAYER_ELIGIBILITY: "Player Eligibility",
  REFEREE_ISSUE: "Referee Issue",
  FIXTURE_ISSUE: "Fixture Issue",
  OTHER: "Other",
};

export const DISPUTE_STATUS_META: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "amber" },
  UNDER_REVIEW: { label: "Under Review", color: "blue" },
  RESOLVED: { label: "Resolved", color: "emerald" },
  REJECTED: { label: "Rejected", color: "destructive" },
};

export const FOOTBALL_POSITIONS = [
  { value: "GOALKEEPER", label: "Goalkeeper" },
  { value: "DEFENDER", label: "Defender" },
  { value: "MIDFIELDER", label: "Midfielder" },
  { value: "FORWARD", label: "Forward" },
];

export const CRICKET_POSITIONS = [
  { value: "BATTER", label: "Batter" },
  { value: "BOWLER", label: "Bowler" },
  { value: "ALLROUNDER", label: "All-rounder" },
  { value: "WICKETKEEPER", label: "Wicket-keeper" },
];

export const MATCH_ROUNDS = [
  { value: "GROUP", label: "Group Stage" },
  { value: "ROUND_1", label: "Round 1" },
  { value: "ROUND_16", label: "Round of 16" },
  { value: "QUARTER_FINAL", label: "Quarter Final" },
  { value: "SEMI_FINAL", label: "Semi Final" },
  { value: "FINAL", label: "Final" },
];

// Bangladesh geo data
export const BANGLADESH_DIVISIONS: Record<string, string[]> = {
  Dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Manikganj", "Munshiganj", "Faridpur", "Tangail"],
  Chittagong: ["Chattogram", "Cox's Bazar", "Comilla", "Feni", "Brahmanbaria"],
  Rajshahi: ["Rajshahi", "Bogura", "Pabna", "Natore", "Sirajganj"],
  Khulna: ["Khulna", "Jessore", "Satkhira", "Bagerhat"],
  Sylhet: ["Sylhet", "Habiganj", "Moulvibazar", "Sunamganj"],
  Barishal: ["Barishal", "Patuakhali", "Pirojpur", "Jhalokati"],
  Rangpur: ["Rangpur", "Dinajpur", "Nilphamari", "Kurigram"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

export const SPORTS_LIST = Object.values(SPORTS);
