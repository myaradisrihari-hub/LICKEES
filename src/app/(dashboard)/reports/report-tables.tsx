"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { TopSeller } from "@/lib/data";
import type { WastageReason } from "@/lib/types";

export function ReportTopSellers({ data }: { data: TopSeller[] }) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No sales recorded this month.
      </p>
    );
  }
  const max = Math.max(...data.map((d) => d.pieces), 1);
  return (
    <ul className="space-y-3">
      {data.map((s, i) => (
        <li key={s.name}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">
              {i + 1}. {s.name}
            </span>
            <span className="text-muted-foreground">
              {formatNumber(s.pieces)} pcs
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(s.pieces / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ReportExpenses({
  data,
}: {
  data: { reason: string; amount: number; count: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No expenses recorded this month.
      </p>
    );
  }
  const total = data.reduce((s, e) => s + e.amount, 0);
  const max = Math.max(...data.map((e) => e.amount), 1);
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {data.map((e) => (
          <li key={e.reason}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-medium">
                {e.reason}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ×{formatNumber(e.count)}
                </span>
              </span>
              <span className="shrink-0 font-semibold text-red-600">
                {formatCurrency(e.amount)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-rose-400"
                style={{ width: `${(e.amount / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t pt-3 text-sm font-semibold">
        <span>Total</span>
        <span className="text-red-600">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export function ReportWastage({
  data,
}: {
  data: { reason: WastageReason; quantity: number; loss: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No wastage this month — well managed!
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {data.map((w) => (
        <li
          key={w.reason}
          className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"
        >
          <Badge variant="outline" className="rounded-lg">
            {w.reason}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatNumber(w.quantity)} pcs
          </span>
          <span className="text-sm font-semibold text-red-600">
            {formatCurrency(w.loss)}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface DailyRow {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export function ReportDailyTable({ data }: { data: DailyRow[] }) {
  const columns: ColumnDef<DailyRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "revenue",
      header: "Revenue",
      cell: ({ row }) => formatCurrency(row.original.revenue),
    },
    {
      accessorKey: "expenses",
      header: "Expenses",
      cell: ({ row }) => formatCurrency(row.original.expenses),
    },
    {
      accessorKey: "profit",
      header: "Profit",
      cell: ({ row }) => (
        <span
          className={
            row.original.profit >= 0 ? "text-emerald-600" : "text-red-600"
          }
        >
          {formatCurrency(row.original.profit)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search days…"
      emptyMessage="No activity recorded this month."
    />
  );
}
