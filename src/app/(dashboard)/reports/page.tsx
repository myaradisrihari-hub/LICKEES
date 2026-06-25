import {
  CalendarRange,
  TrendingDown,
  PiggyBank,
  BarChart3,
  Trophy,
  TriangleAlert,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { ProfitLineChart } from "@/components/charts";
import { ExportButtons } from "@/components/export-buttons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMonthlyReport } from "@/lib/data";
import { formatCurrency, formatDate, monthLabel, currentMonth } from "@/lib/format";
import { MonthPicker } from "./month-picker";
import {
  ReportTopSellers,
  ReportExpenses,
  ReportWastage,
  ReportDailyTable,
} from "./report-tables";

export const dynamic = "force-dynamic";

function pctChange(now: number, prev: number): { text: string; up: boolean } | null {
  if (prev === 0) return null;
  const change = ((now - prev) / Math.abs(prev)) * 100;
  return { text: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`, up: change >= 0 };
}

function Comparison({ now, prev }: { now: number; prev: number }) {
  const c = pctChange(now, prev);
  if (!c) return <span className="text-xs text-muted-foreground">vs last month —</span>;
  const Icon = c.up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        c.up ? "text-emerald-600" : "text-red-600"
      }`}
    >
      <Icon className="size-3.5" />
      {c.text} vs last month
    </span>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();
  const report = await getMonthlyReport(month);
  const label = monthLabel(month);

  const exportRows = report.dailySeries
    .filter((d) => d.revenue > 0 || d.expenses > 0)
    .map((d) => ({
      date: formatDate(d.date),
      revenue: d.revenue,
      expenses: d.expenses,
      profit: d.profit,
    }));

  return (
    <div>
      <PageHeader title="Reports" description={`Monthly analytics for ${label}`}>
        <MonthPicker month={month} />
        <ExportButtons
          filename={`lickees-report-${month}`}
          title={`Monthly Report — ${label}`}
          sheetName={label}
          columns={[
            { header: "Date", key: "date" },
            { header: "Revenue", key: "revenue" },
            { header: "Expenses", key: "expenses" },
            { header: "Profit", key: "profit" },
          ]}
          rows={exportRows}
          subtitleLines={[
            `Revenue: ${formatCurrency(report.revenue)}   Expenses: ${formatCurrency(report.expenses)}   Profit: ${formatCurrency(report.profit)}`,
            `Average daily income: ${formatCurrency(report.avgDailyIncome)}`,
          ]}
        />
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <CalendarRange className="size-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(report.revenue)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <Comparison now={report.revenue} prev={report.prev.revenue} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                <TrendingDown className="size-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(report.expenses)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <Comparison now={report.expenses} prev={report.prev.expenses} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div
                className={`flex size-12 items-center justify-center rounded-xl ${
                  report.profit >= 0
                    ? "bg-primary/10 text-primary"
                    : "bg-red-500/10 text-red-600"
                }`}
              >
                <PiggyBank className="size-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Profit</p>
                <p
                  className={`text-2xl font-bold ${
                    report.profit >= 0 ? "text-primary" : "text-red-600"
                  }`}
                >
                  {formatCurrency(report.profit)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <Comparison now={report.profit} prev={report.prev.profit} />
            </div>
          </CardContent>
        </Card>

        <StatCard
          label="Average Daily Income"
          value={formatCurrency(report.avgDailyIncome)}
          icon={BarChart3}
        />
        <StatCard
          label="Highest Sales Day"
          value={
            report.highestSalesDay
              ? formatCurrency(report.highestSalesDay.revenue)
              : "—"
          }
          icon={Trophy}
          tone="positive"
          hint={
            report.highestSalesDay
              ? formatDate(report.highestSalesDay.date)
              : "No sales yet"
          }
        />
        <StatCard
          label="Total Wastage Loss"
          value={formatCurrency(report.totalWastageLoss)}
          icon={TriangleAlert}
          tone="warning"
        />
      </div>

      <div className="mb-6">
        <ProfitLineChart
          data={report.dailySeries.map((d) => ({
            date: formatDate(d.date, "dd"),
            profit: d.profit,
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-5 text-primary" /> Top Selling Ice Creams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportTopSellers data={report.topSellers} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-5 text-rose-500" /> Expenses by Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportExpenses data={report.expensesByReason} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TriangleAlert className="size-5 text-amber-500" /> Wastage Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportWastage data={report.wastage} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Daily breakdown</h2>
        <ReportDailyTable
          data={report.dailySeries.filter(
            (d) => d.revenue > 0 || d.expenses > 0,
          )}
        />
      </div>
    </div>
  );
}
