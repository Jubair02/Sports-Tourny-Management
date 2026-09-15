"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview", segment: "" },
  { key: "fixtures", label: "Fixtures", segment: "/fixtures" },
  { key: "standings", label: "Standings", segment: "/standings" },
  { key: "teams", label: "Teams", segment: "/teams" },
  { key: "matches", label: "Matches", segment: "/matches" },
];

export function TournamentTabs({ base }: { base: string }) {
  const pathname = usePathname();
  const baseTrim = base.replace(/\/$/, "");
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-thin border-b">
      {TABS.map((tab) => {
        const href = `${baseTrim}${tab.segment}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
