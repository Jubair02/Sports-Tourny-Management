import { SPORT_META } from "@/lib/constants";
import { StatusBadge } from "./status-badge";

export function SportBadge({ sport, withEmoji = true }: { sport: string; withEmoji?: boolean }) {
  const meta = SPORT_META[sport];
  if (!meta) return <StatusBadge label={sport} />;
  return (
    <StatusBadge label={`${withEmoji ? meta.emoji + " " : ""}${meta.label}`} color={meta.color} />
  );
}
