import { cn } from "@/lib/utils";

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20",
  blue: "bg-sky-500/15 text-sky-700 dark:text-sky-400 ring-1 ring-sky-500/20",
  destructive: "bg-red-500/15 text-red-700 dark:text-red-400 ring-1 ring-red-500/20",
  secondary: "bg-secondary text-secondary-foreground ring-1 ring-border",
  rose: "bg-rose-500/15 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/20",
  teal: "bg-teal-500/15 text-teal-700 dark:text-teal-400 ring-1 ring-teal-500/20",
  orange: "bg-orange-500/15 text-orange-700 dark:text-orange-400 ring-1 ring-orange-500/20",
  cyan: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-500/20",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-400 ring-1 ring-violet-500/20",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400 ring-1 ring-fuchsia-500/20",
};

export function StatusBadge({
  label,
  color = "secondary",
  className,
  dot = false,
}: {
  label: string;
  color?: string;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        COLOR_MAP[color] ?? COLOR_MAP.secondary,
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {label}
    </span>
  );
}
