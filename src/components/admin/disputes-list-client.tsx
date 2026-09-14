"use client";

import { useState } from "react";
import { DisputeRow } from "./dispute-row";

type Dispute = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  raisedBy: { id: string; name: string; email: string; role: string } | null;
  tournament: { id: string; name: string } | null;
  match: { id: string; matchCode: string | null; homeTeam: { name: string } | null; awayTeam: { name: string } | null } | null;
};

export function DisputesListClient({ disputes }: { disputes: Dispute[] }) {
  const [expanded, setExpanded] = useState<string | null>(disputes[0]?.id ?? null);

  return (
    <div className="max-h-[70vh] space-y-2 overflow-y-auto scrollbar-thin pr-1">
      {disputes.map((d) => (
        <DisputeRow
          key={d.id}
          dispute={d}
          expanded={expanded === d.id}
          onToggle={() => setExpanded((cur) => (cur === d.id ? null : d.id))}
        />
      ))}
    </div>
  );
}
