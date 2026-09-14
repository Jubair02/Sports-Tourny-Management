"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Tab = { key: string; label: string };

export function UrlTabs({
  param,
  tabs,
  defaultKey,
}: {
  param: string;
  tabs: Tab[];
  defaultKey: string;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get(param) ?? defaultKey;

  return (
    <div className="flex w-fit gap-1 rounded-lg border bg-muted/40 p-1">
      {tabs.map((t) => {
        const active = current === t.key;
        const qs = new URLSearchParams(sp.toString());
        if (t.key === defaultKey) qs.delete(param);
        else qs.set(param, t.key);
        const href = qs.toString() ? `${pathname}?${qs.toString()}` : pathname;
        return (
          <Link
            key={t.key}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
