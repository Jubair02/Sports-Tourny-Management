'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, X, Bell, LogOut, ChevronDown, LayoutDashboard, ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type NavItem } from "@/lib/nav";

export type DashUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
};

function NotificationsBell() {
  const [data, setData] = useState<{ notifications: any[]; unread: number }>({ notifications: [], unread: 0 });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then(setData).catch(() => {});
    const i = setInterval(() => fetch("/api/notifications").then((r) => r.json()).then(setData).catch(() => {}), 25000);
    return () => clearInterval(i);
  }, []);
  return (
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
            <button onClick={async () => { await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ all: true }) }); fetch("/api/notifications").then((r) => r.json()).then(setData); }} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {data.notifications.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            data.notifications.map((n) => (
              <Link key={n.id} href={n.link ?? "#"} onClick={() => { if (!n.read) fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ id: n.id }) }); setOpen(false); }} className={cn("flex gap-3 border-b px-3 py-2.5 text-sm hover:bg-accent/50", !n.read && "bg-primary/5")}>
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
  );
}

// Module-level sidebar content (avoids defining a component during render)
function SidebarContent({
  navItems,
  roleLabel,
  pathname,
  onNavigate,
}: {
  navItems: NavItem[];
  roleLabel: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isExactHome = (href: string) => ["/admin", "/organizer", "/team", "/referee"].includes(href);
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {roleLabel}
        </p>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = isExactHome(item.href) ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-3">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
          <ExternalLink className="h-3.5 w-3.5" />
          View Public Site
        </Link>
      </div>
    </div>
  );
}

export function DashboardShell({
  user,
  navItems,
  children,
}: {
  user: DashUser;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-card md:block">
        <SidebarContent navItems={navItems} roleLabel={roleLabel} pathname={pathname} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <Logo />
              <SheetClose asChild><Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button></SheetClose>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarContent navItems={navItems} roleLabel={roleLabel} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex w-full flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LayoutDashboard className="hidden h-4 w-4 sm:block" />
            <span className="font-medium capitalize text-foreground">{roleLabel} Panel</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
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
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
