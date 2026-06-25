"use client";

import { motion } from "framer-motion";
import { IceCream2, Coins, Sparkles, ShoppingBag } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { type FormatKind } from "@/lib/format";

export function IceCreamRevenueHero({
  iceCreamRevenue,
  totalRevenue,
  iceCreamProfit,
  piecesSold,
}: {
  iceCreamRevenue: number;
  totalRevenue: number;
  iceCreamProfit: number;
  piecesSold: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 shadow-soft sm:p-8">
      {/* floating colorful blobs */}
      <div className="pointer-events-none absolute -left-16 -top-20 size-56 animate-blob rounded-full bg-gradient-to-br from-pink-300/60 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-10 size-52 animate-float-slow rounded-full bg-gradient-to-br from-sky-300/60 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-48 rounded-full bg-gradient-to-br from-violet-300/50 to-transparent blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-400 via-violet-400 to-sky-400 text-white shadow-glow"
          >
            <IceCream2 className="size-10" />
          </motion.div>
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="size-4 text-violet-500" /> Monthly Ice Cream Revenue
            </p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight text-gradient tabular-nums sm:text-5xl">
              <AnimatedNumber value={iceCreamRevenue} format="currency" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Automatically calculated from sold pieces × selling price.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <HeroStat icon={Coins} label="Total" value={totalRevenue} format="currency" tint="text-emerald-600" />
          <HeroStat icon={Sparkles} label="IC Profit" value={iceCreamProfit} format="currency" tint="text-violet-600" />
          <HeroStat icon={ShoppingBag} label="Pieces" value={piecesSold} format="number" tint="text-pink-600" />
        </div>
      </div>
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  format,
  tint,
}: {
  icon: typeof Coins;
  label: string;
  value: number;
  format: FormatKind;
  tint: string;
}) {
  return (
    <div className="rounded-2xl bg-white/50 p-3 text-center shadow-sm backdrop-blur">
      <Icon className={`mx-auto size-5 ${tint}`} />
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${tint}`}>
        <AnimatedNumber value={value} format={format} />
      </p>
    </div>
  );
}
