import {
  LayoutDashboard, Trophy, Users, User, MapPin, Flag, BarChart3,
  Bell, Settings, FileText, ScrollText, CalendarDays, ClipboardList,
  Award, Megaphone, ShieldAlert, FileBarChart, ClipboardCheck, ShieldCheck,
  Hand, Gamepad2, ListChecks, History, UserCircle, Building2, CreditCard,
} from "lucide-react";
import type { Role } from "./constants";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const NAV_CONFIG: Record<string, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/admin/teams", label: "Teams", icon: Users },
    { href: "/admin/matches", label: "Matches", icon: CalendarDays },
    { href: "/admin/venues", label: "Venues", icon: MapPin },
    { href: "/admin/disputes", label: "Disputes", icon: ShieldAlert },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    { href: "/admin/reports", label: "Reports", icon: FileBarChart },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
  ORGANIZER: [
    { href: "/organizer", label: "Overview", icon: LayoutDashboard },
    { href: "/organizer/tournaments", label: "My Tournaments", icon: Trophy },
    { href: "/organizer/registrations", label: "Registrations", icon: ClipboardCheck },
    { href: "/organizer/teams", label: "Teams", icon: Users },
    { href: "/organizer/fixtures", label: "Fixtures", icon: CalendarDays },
    { href: "/organizer/matches", label: "Matches", icon: ListChecks },
    { href: "/organizer/results", label: "Results", icon: BarChart3 },
    { href: "/organizer/referees", label: "Referees", icon: Flag },
    { href: "/organizer/venues", label: "Venues", icon: MapPin },
    { href: "/organizer/announcements", label: "Announcements", icon: Megaphone },
    { href: "/organizer/disputes", label: "Disputes", icon: ShieldAlert },
    { href: "/organizer/settings", label: "Settings", icon: Settings },
  ],
  TEAM_MANAGER: [
    { href: "/team", label: "Overview", icon: LayoutDashboard },
    { href: "/team/teams", label: "My Teams", icon: Users },
    { href: "/team/players", label: "Players", icon: User },
    { href: "/team/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/team/applications", label: "Applications", icon: ClipboardList },
    { href: "/team/fixtures", label: "Fixtures", icon: CalendarDays },
    { href: "/team/results", label: "Results", icon: BarChart3 },
    { href: "/team/standings", label: "Standings", icon: Award },
    { href: "/team/disputes", label: "Report Issue", icon: ShieldAlert },
    { href: "/team/profile", label: "Profile", icon: UserCircle },
  ],
  REFEREE: [
    { href: "/referee", label: "Overview", icon: LayoutDashboard },
    { href: "/referee/matches", label: "My Assignments", icon: CalendarDays },
    { href: "/referee/submit", label: "Submit Result", icon: ClipboardCheck },
    { href: "/referee/history", label: "Match History", icon: History },
    { href: "/referee/profile", label: "Profile", icon: UserCircle },
  ],
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  ORGANIZER: "Organizer",
  TEAM_MANAGER: "Team Manager",
  REFEREE: "Referee",
  PUBLIC: "Visitor",
};
