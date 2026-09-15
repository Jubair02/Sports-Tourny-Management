import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-bold", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Trophy className="h-5 w-5" />
      </div>
      {withText && (
        <span className="text-lg tracking-tight">
          Tourney<span className="text-primary">BD</span>
        </span>
      )}
    </Link>
  );
}
