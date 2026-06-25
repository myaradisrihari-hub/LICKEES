import {
  IceCream2,
  Coins,
  Boxes,
  PiggyBank,
  Sparkles,
  Layers,
  ShoppingBag,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Stagger, FadeIn } from "@/components/motion";
import { AnimatedNumber } from "@/components/animated-number";
import { IceCreamRevenueHero } from "./_components/hero";
import {
  RevenueTrendChart,
  ExpensesTrendChart,
  ProfitTrendChart,
  StockPurchaseTrendChart,
  TopSellersChart,
  InventoryDistributionChart,
  MonthlyComparisonChart,
} from "@/components/charts";
import { getDashboardData } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const monthLabel = format(new Date(), "MMMM yyyy");
  const { month, inventory, charts } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Monthly analytics · ${monthLabel}`}
      />

      <FadeIn>
        <IceCreamRevenueHero
          iceCreamRevenue={month.iceCreamRevenue}
          totalRevenue={month.totalRevenue}
          iceCreamProfit={month.iceCreamProfit}
          piecesSold={month.piecesSold}
        />
      </FadeIn>

      {/* ── Ice Cream ─────────────────────────────────────────────────── */}
      <section>
        <FadeIn>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-muted-foreground">
            <IceCream2 className="size-5 text-emerald-500" /> Ice Cream
          </h2>
        </FadeIn>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Current Inventory Value" value={inventory.value} format="currency" icon={Boxes} color="sky" hint="Remaining pieces × cost" />
          <MetricCard label="Remaining Pieces" value={inventory.remainingPieces} format="number" icon={Layers} color="sky" />
          <MetricCard label="Average Daily Sales" value={inventory.avgDailySales} format="decimal1" icon={ShoppingBag} color="pink" hint="Pieces/day this month" />
          <MetricCard label="Melted Cost" value={month.meltedCost} format="currency" icon={TrendingDown} color="rose" hint="Melted pieces × bought price" />
        </Stagger>
      </section>

      {/* ── Total Revenue & Profit ────────────────────────────────────── */}
      <section className="space-y-4">
        <FadeIn>
          <h2 className="flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-muted-foreground">
            <Coins className="size-5 text-lime-500" /> Total Revenue & Profit
          </h2>
        </FadeIn>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total Revenue" value={month.totalRevenue} format="currency" icon={Coins} color="lime" hint="Daily entry total" />
          <MetricCard label="Average Daily Income" value={month.avgDailyIncome} format="currency" icon={Wallet} color="emerald" hint="Per day with entries" />
          <MetricCard label="Monthly Expenses" value={month.expenses} format="currency" icon={TrendingDown} color="rose" />
          <MetricCard label="Net Profit" value={month.netProfit} format="currency" icon={PiggyBank} color="emerald" hint="Revenue − expenses" />
        </Stagger>
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl glass-strong p-6 shadow-soft">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br from-emerald-300/50 to-transparent blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-glow">
                  <PiggyBank className="size-7" />
                </div>
                <div>
                  <p className="text-base font-medium text-muted-foreground">
                    Net Profit · {monthLabel}
                  </p>
                  <p className="text-3xl font-extrabold tracking-tight text-emerald-700 tabular-nums sm:text-4xl">
                    <AnimatedNumber value={month.netProfit} format="currency" />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="size-4" /> Total revenue {formatCurrency(month.totalRevenue)} − expenses{" "}
                {formatCurrency(month.expenses)}
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="space-y-4">
        <FadeIn>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="size-4 text-pink-500" /> Analytics
          </h2>
        </FadeIn>
        <div className="grid gap-4 lg:grid-cols-2">
          <FadeIn delay={0.05}>
            <RevenueTrendChart data={charts.revenueTrend} />
          </FadeIn>
          <FadeIn delay={0.1}>
            <ProfitTrendChart data={charts.profitTrend} />
          </FadeIn>
          <FadeIn delay={0.15}>
            <ExpensesTrendChart data={charts.expensesTrend} />
          </FadeIn>
          <FadeIn delay={0.2}>
            <StockPurchaseTrendChart data={charts.purchaseTrend} />
          </FadeIn>
          <FadeIn delay={0.25}>
            <TopSellersChart data={charts.topSellers} />
          </FadeIn>
          <FadeIn delay={0.3}>
            <InventoryDistributionChart data={charts.inventoryDistribution} />
          </FadeIn>
          <FadeIn delay={0.35} className="lg:col-span-2">
            <MonthlyComparisonChart data={charts.monthlyComparison} />
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
