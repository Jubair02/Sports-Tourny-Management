"use client";

import { DashboardShell, type DashUser } from "@/components/dashboard/dashboard-shell";
import { NAV_CONFIG, type NavItem } from "@/lib/nav";

/**
 * Client-side wrapper that imports NAV_CONFIG.ORGANIZER on the client side.
 * NAV_CONFIG contains lucide-react icon *functions* (component types),
 * which can't be serialized across the server→client boundary — so we
 * import it here on the client and pass it to DashboardShell.
 */
export function OrganizerShell({ user, children }: { user: DashUser; children: React.ReactNode }) {
  const navItems: NavItem[] = NAV_CONFIG.ORGANIZER;
  return <DashboardShell user={user} navItems={navItems}>{children}</DashboardShell>;
}
