"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { value: string; label: string };

export function UrlSelectFilter({
  param,
  placeholder,
  options,
  className,
}: {
  param: string;
  placeholder: string;
  options: Option[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = searchParams.get(param) ?? "all";

  const onChange = useCallback(
    (value: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") sp.set(param, value);
      else sp.delete(param);
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams, param],
  );

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className={className ?? "h-9 w-[150px]"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function UrlSearchFilter({ param, placeholder }: { param: string; placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(param) ?? "";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (fd.get(param) as string) || "";
    const sp = new URLSearchParams(searchParams.toString());
    if (v.trim()) sp.set(param, v.trim());
    else sp.delete(param);
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <form onSubmit={onSubmit} className="relative flex-1 min-w-[200px]">
      <input
        name={param}
        defaultValue={current}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
      />
    </form>
  );
}
