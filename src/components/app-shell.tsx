"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { IceCream2, LayoutGrid } from "lucide-react";
import { NAV_ITEMS, BOTTOM_NAV_HREFS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-gradient-to-r from-emerald-400/90 to-teal-400/90 text-white shadow-glow"
                : "text-foreground/70 hover:bg-white/50 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-xl transition-colors",
                active
                  ? "bg-white/25 text-white"
                  : "bg-white/60 text-foreground/70 group-hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" prefetch className="flex items-center gap-3 px-2">
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 via-violet-400 to-sky-400 text-white shadow-glow"
      >
        <IceCream2 className="size-6" />
      </motion.div>
      <div className="min-w-0">
        <p className="truncate text-lg font-extrabold leading-tight text-gradient">
          Lickees
        </p>
        <p className="truncate text-[11px] font-medium text-muted-foreground">
          Juice & Ice Cream
        </p>
      </div>
    </Link>
  );
}

export function AppShell({
  children,
  shopName,
}: {
  children: React.ReactNode;
  shopName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const bottomItems = BOTTOM_NAV_HREFS.map((href) =>
    NAV_ITEMS.find((i) => i.href === href),
  ).filter(Boolean) as typeof NAV_ITEMS;

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col p-4 lg:flex">
        <div className="flex h-full flex-col rounded-3xl glass-strong p-4 shadow-soft">
          <Brand />
          <div className="mt-6 flex-1 overflow-y-auto hide-scrollbar">
            <NavLinks pathname={pathname} />
          </div>
          <div className="mt-3 rounded-2xl bg-gradient-to-br from-emerald-400/15 to-sky-400/15 p-3">
            <p className="truncate text-xs font-medium text-foreground/70">
              {shopName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Daily work in under 2 minutes.
            </p>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 glass-nav lg:hidden">
          <Brand />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex size-10 items-center justify-center rounded-2xl glass shadow-soft">
                <LayoutGrid className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 border-none glass-strong p-4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Brand />
              <div className="mt-6">
                <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 pb-28 sm:p-6 lg:p-8 lg:pb-8">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around gap-1 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 glass-nav border-t border-white/40 lg:hidden">
        {bottomItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5"
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-2xl transition-all",
                  active
                    ? "bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-glow"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.shortTitle ?? item.title}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl text-muted-foreground">
            <LayoutGrid className="size-5" />
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">More</span>
        </button>
      </nav>
    </div>
  );
}
