'use client'

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu, X, Search, Trophy, Users, User, CalendarDays, BarChart3,
  MapPin, Info, LogIn, Bell, LayoutDashboard, LogOut, ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const PUBLIC_NAV = [
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/players", label: "Players", icon: User },
  { href: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/venues", label: "Venues", icon: MapPin },
  { href: "/about", label: "About", icon: Info },
];

const ROLE_DASHBOARD: Record<string, { href: string; label: string }> = {
  ADMIN: { href: "/admin", label: "Admin Dashboard" },
  ORGANIZER: { href: "/organizer", label: "Organizer Dashboard" },
  TEAM_MANAGER: { href: "/team", label: "Team Dashboard" },
  REFEREE: { href: "/referee", label: "Referee Dashboard" },
};

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ notifications: any[]; unread: number }>({ notifications: [], unread: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then(setData).catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/notifications").then((r) => r.json()).then(setData).catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4.5 w-4.5" />
            {data.unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {data.unread > 9 ? "9+" : data.unread}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {data.unread > 0 && (
              <button
                onClick={async () => {
                  await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ all: true }) });
                  fetch("/api/notifications").then((r) => r.json()).then(setData);
                }}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {data.notifications.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              data.notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => {
                    if (!n.read) {
                      fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ id: n.id }) });
                    }
                    setOpen(false);
                  }}
                  className={cn(
                    "flex gap-3 border-b px-3 py-2.5 text-sm hover:bg-accent/50",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{n.when}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function SiteHeader() {
  const { user, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/tournaments?q=${encodeURIComponent(search.trim())}`);
  };

  const dash = user ? ROLE_DASHBOARD[user.role] : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex items-center justify-between border-b p-4">
              <Logo />
              <SheetClose asChild>
                <Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button>
              </SheetClose>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {PUBLIC_NAV.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent",
                      pathname === item.href && "bg-accent text-primary"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                pathname === item.href && "bg-accent text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form onSubmit={onSearch} className="hidden lg:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tournaments..."
                className="h-9 w-44 pl-8 lg:w-56"
              />
            </div>
          </form>

          <ThemeToggle />

          {user ? (
            <>
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 px-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden text-sm font-medium sm:inline">{user.name.split(" ")[0]}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {dash && (
                    <DropdownMenuItem asChild>
                      <Link href={dash.href}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {dash.label}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm" className="h-9">
              <Link href="/login"><LogIn className="mr-1.5 h-4 w-4" />Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
