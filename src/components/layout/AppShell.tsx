"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, DEBUG_ITEM } from "./navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme-provider";
import { useOutboxStore } from "@/store/outbox";
import { useNetworkStatus } from "@/hooks/use-network";
import { Bell, Circle, Menu } from "lucide-react";
import { useState, useEffect } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { queue } = useOutboxStore();
  const online = useNetworkStatus();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // avoid SSR/CSR content mismatch for values that depend on client-only state
  useEffect(() => setMounted(true), []);

  const navItems = [...NAV_ITEMS, DEBUG_ITEM];

  const renderNavItem = (item: (typeof navItems)[number]) => {
    const active = pathname?.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
          active
            ? "bg-primary/10 text-primary"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        )}
        aria-label={item.label}
      >
        <Icon className="h-4 w-4" />
        <span className="hidden md:inline">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-[hsl(var(--bg))] text-foreground">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-border bg-card/80 p-4 backdrop-blur lg:flex">
        <div className="flex items-center justify-between pb-6">
          <div>
            <div className="text-lg font-semibold">ERP Planner</div>
            <div className="text-xs text-slate-500">Focus & Productivity</div>
          </div>
          <span className={cn("flex items-center gap-1 text-xs", mounted ? (online ? "text-success" : "text-danger") : "text-slate-400")}
            aria-label={mounted ? (online ? "Online" : "Offline") : "Unknown"}
          >
            <Circle className="h-3 w-3" fill={mounted ? (online ? "#16a34a" : "#dc2626") : "#9CA3AF"} />
            {mounted ? (online ? "Online" : "Offline") : ""}
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">{navItems.map(renderNavItem)}</nav>
        <div className="mt-auto flex items-center justify-between rounded-2xl border border-border px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
          <div>
            <div className="font-semibold">Outbox</div>
            <div>{mounted ? `${queue.length} операции` : "… операции"}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.location.assign("/debug")}>Debug</Button>
            <Button variant="outline" size="sm" onClick={toggle}>{theme === "dark" ? "Light" : "Dark"}</Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            className="rounded-xl border border-border p-2"
            aria-label="Toggle navigation"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-base font-semibold">ERP Planner</div>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className={cn("flex items-center gap-1", mounted ? (online ? "text-success" : "text-danger") : "text-slate-400")}>● {mounted ? (online ? "Online" : "Offline") : ""}</span>
            <Button variant="outline" size="sm" onClick={toggle} aria-label="Toggle theme">
              {mounted ? (theme === "dark" ? "Light" : "Dark") : "..."}
            </Button>
          </div>
        </header>

        {mobileNavOpen && (
          <div className="border-b border-border bg-card px-4 py-2 lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <div key={item.href} onClick={() => setMobileNavOpen(false)}>
                  {renderNavItem(item)}
                </div>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-[hsl(var(--bg))] px-4 pb-24 pt-4 lg:px-8 lg:pb-8">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 px-2 py-2 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5 gap-1 text-xs">
            {NAV_ITEMS.slice(0, 4).map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center rounded-xl px-2 py-1",
                    active ? "text-primary" : "text-slate-500"
                  )}
                  aria-label={item.label}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/debug"
              className={cn(
                "flex flex-col items-center rounded-xl px-2 py-1",
                pathname?.startsWith("/debug") ? "text-primary" : "text-slate-500"
              )}
              aria-label="More"
            >
              <Bell className="h-4 w-4" />
              <span>More</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
