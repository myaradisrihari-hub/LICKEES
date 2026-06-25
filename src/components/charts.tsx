"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";

const COLORS = {
  emerald: "#34d399",
  rose: "#fb7185",
  violet: "#a78bfa",
  sky: "#38bdf8",
  pink: "#f472b6",
  lime: "#a3e635",
  amber: "#fbbf24",
  cyan: "#22d3ee",
};

const PALETTE = [
  COLORS.emerald,
  COLORS.pink,
  COLORS.violet,
  COLORS.sky,
  COLORS.lime,
  COLORS.amber,
];

function ChartCard({
  title,
  icon,
  children,
  height = 260,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid color-mix(in oklch, white 60%, transparent)",
  background: "color-mix(in oklch, var(--popover) 85%, transparent)",
  backdropFilter: "blur(10px)",
  color: "var(--popover-foreground)",
  fontSize: 12,
  boxShadow: "0 10px 30px -10px rgba(80,60,120,0.3)",
};

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

function gradient(id: string, color: string) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={color} stopOpacity={0.55} />
      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
    </linearGradient>
  );
}

export function RevenueTrendChart({
  data,
}: {
  data: { label: string; revenue: number }[];
}) {
  return (
    <ChartCard title="Revenue Trend">
      <AreaChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
        <defs>{gradient("rev", COLORS.emerald)}</defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickFormatter={(v) => `₹${v}`} width={48} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke={COLORS.emerald}
          strokeWidth={3}
          fill="url(#rev)"
        />
      </AreaChart>
    </ChartCard>
  );
}

export function ExpensesTrendChart({
  data,
}: {
  data: { label: string; expenses: number }[];
}) {
  return (
    <ChartCard title="Expenses Trend">
      <AreaChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
        <defs>{gradient("exp", COLORS.rose)}</defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickFormatter={(v) => `₹${v}`} width={48} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
        <Area
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke={COLORS.rose}
          strokeWidth={3}
          fill="url(#exp)"
        />
      </AreaChart>
    </ChartCard>
  );
}

export function ProfitTrendChart({
  data,
}: {
  data: { label: string; profit: number }[];
}) {
  return (
    <ChartCard title="Profit Trend">
      <AreaChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
        <defs>{gradient("prof", COLORS.violet)}</defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickFormatter={(v) => `₹${v}`} width={48} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
        <Area
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke={COLORS.violet}
          strokeWidth={3}
          fill="url(#prof)"
        />
      </AreaChart>
    </ChartCard>
  );
}

export function StockPurchaseTrendChart({
  data,
}: {
  data: { label: string; amount: number }[];
}) {
  return (
    <ChartCard title="Stock Purchase Trend">
      <BarChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="purch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.sky} stopOpacity={0.95} />
            <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickFormatter={(v) => `₹${v}`} width={48} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
        <Bar dataKey="amount" name="Purchases" fill="url(#purch)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export function TopSellersChart({
  data,
}: {
  data: { name: string; pieces: number }[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Top Selling Ice Creams">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No sales recorded yet.
        </div>
      </ChartCard>
    );
  }
  return (
    <ChartCard title="Top Selling Ice Creams">
      <BarChart layout="vertical" data={data} margin={{ left: 10, right: 16, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tick={axisTick} width={92} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${formatNumber(Number(v))} pcs`} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
        <Bar dataKey="pieces" name="Pieces sold" radius={[0, 10, 10, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartCard>
  );
}

export function InventoryDistributionChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Inventory Distribution">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No stock to show yet.
        </div>
      </ChartCard>
    );
  }
  return (
    <ChartCard title="Inventory Distribution">
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartCard>
  );
}

export function MonthlyComparisonChart({
  data,
}: {
  data: { name: string; current: number; previous: number }[];
}) {
  return (
    <ChartCard title="Monthly Comparison">
      <BarChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="cur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.95} />
            <stop offset="100%" stopColor={COLORS.lime} stopOpacity={0.6} />
          </linearGradient>
          <linearGradient id="prev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.violet} stopOpacity={0.9} />
            <stop offset="100%" stopColor={COLORS.pink} stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickFormatter={(v) => `₹${v}`} width={48} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="current" name="This month" fill="url(#cur)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="previous" name="Last month" fill="url(#prev)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export function ProfitLineChart({
  data,
}: {
  data: { date: string; profit: number }[];
}) {
  return (
    <ChartCard title="Daily Profit">
      <LineChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={axisTick} interval="preserveStartEnd" tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickFormatter={(v) => `₹${v}`} width={48} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
        <Line
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke={COLORS.emerald}
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ChartCard>
  );
}
