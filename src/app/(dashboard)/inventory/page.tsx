import {
  Package,
  Boxes,
  ShoppingCart,
  PackageCheck,
  Layers,
  Trophy,
  Snail,
  Gauge,
  HeartPulse,
  TrendingUp,
  Coins,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Stagger, FadeIn } from "@/components/motion";
import { requireUser } from "@/lib/supabase/auth";
import { getInventoryAnalytics } from "@/lib/data";
import type { ItemStock } from "@/lib/types";
import { InventoryManager } from "./inventory-manager";

export const dynamic = "force-dynamic";

const pcsLabel = (n: number) => `${Math.round(n).toLocaleString("en-IN")}`;

const healthColor = {
  Excellent: "emerald",
  Healthy: "lime",
  Low: "amber",
  Critical: "rose",
  Empty: "rose",
} as const;

export default async function InventoryPage() {
  const { supabase } = await requireUser();
  const [{ data }, analytics] = await Promise.all([
    supabase.from("item_stock").select("*").order("name", { ascending: true }),
    getInventoryAnalytics(),
  ]);

  const items = (data ?? []) as ItemStock[];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory"
        description="Live stock levels and inventory analytics."
      />

      <section>
        <FadeIn>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Gauge className="size-4 text-sky-500" /> Inventory Analytics
          </h2>
        </FadeIn>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <MetricCard label="Current Inventory Value" value={analytics.currentValue} format="currency" icon={Package} color="sky" />
          <MetricCard label="Monthly Purchase Value" value={analytics.monthlyPurchaseValue} format="currency" icon={ShoppingCart} color="cyan" />
          <MetricCard label="Total Pieces Purchased" value={analytics.totalPiecesPurchased} format="number" icon={Boxes} color="violet" />
          <MetricCard label="Total Pieces Sold" value={analytics.totalPiecesSold} format="number" icon={TrendingUp} color="emerald" />
          <MetricCard label="Remaining Pieces" value={analytics.remainingPieces} format="number" icon={Layers} color="sky" />
          <MetricCard label="Equivalent Boxes Left" value={analytics.equivalentBoxes} format="decimal1" icon={PackageCheck} color="amber" />
          <MetricCard label="Average Daily Sales" value={analytics.avgDailySales} format="piecesDecimal" icon={Coins} color="pink" />
          <MetricCard label="Stock Utilization" value={analytics.stockUtilization} format="percent" icon={Gauge} color="lime" hint="Sold ÷ purchased" />
          <MetricCard label="Top Selling Item" text={analytics.topSelling?.name ?? "—"} icon={Trophy} color="emerald" hint={analytics.topSelling ? `${pcsLabel(analytics.topSelling.pieces)} pcs` : "No sales yet"} />
          <MetricCard label="Slowest Selling Item" text={analytics.slowestSelling?.name ?? "—"} icon={Snail} color="rose" hint={analytics.slowestSelling ? `${pcsLabel(analytics.slowestSelling.pieces)} pcs` : "—"} />
          <MetricCard label="Inventory Health" text={analytics.health} icon={HeartPulse} color={healthColor[analytics.health]} />
        </Stagger>
      </section>

      <section>
        <FadeIn>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Boxes className="size-4 text-violet-500" /> Items
          </h2>
        </FadeIn>
        <InventoryManager items={items} />
      </section>
    </div>
  );
}
