"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Refrigerator, Sparkles, PackageCheck, Boxes } from "lucide-react";
import type { ItemStock } from "@/lib/types";
import { planOrder, type PlannerRow } from "@/lib/analytics";
import { formatNumber } from "@/lib/format";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function fmtDays(days: number | null): string {
  if (days === null) return "—";
  if (!Number.isFinite(days)) return "∞";
  return `${days.toFixed(1)} d`;
}

export function PlannerView({
  stock,
  soldPieces,
  windowDays,
  defaultCapacity,
}: {
  stock: ItemStock[];
  soldPieces: Record<string, number>;
  windowDays: number;
  defaultCapacity: number;
}) {
  const [capacity, setCapacity] = useState(String(defaultCapacity));

  const result = useMemo(
    () =>
      planOrder({
        stock,
        soldPieces,
        windowDays,
        fridgeCapacity: Number(capacity) || 0,
      }),
    [stock, soldPieces, windowDays, capacity],
  );

  const orderList = result.rows.filter((r) => r.suggestedBoxes > 0);

  const columns: ColumnDef<PlannerRow>[] = [
    {
      accessorKey: "name",
      header: "Item",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: "currentStock",
      header: "Current Stock",
      accessorFn: (r) => r.remainingPieces,
      cell: ({ row }) => {
        const r = row.original;
        const boxes = r.piecesPerBox > 0 ? r.remainingPieces / r.piecesPerBox : 0;
        return (
          <span>
            {formatNumber(r.remainingPieces)} pcs
            <span className="text-muted-foreground"> · {boxes.toFixed(1)} box</span>
          </span>
        );
      },
    },
    {
      accessorKey: "avgDailySales",
      header: "Avg Daily Sales",
      cell: ({ row }) => `${row.original.avgDailySales.toFixed(1)} pcs`,
    },
    {
      accessorKey: "daysRemaining",
      header: "Days Left",
      cell: ({ row }) => {
        const d = row.original.daysRemaining;
        const tone =
          d !== null && Number.isFinite(d) && d < 5
            ? "destructive"
            : "secondary";
        return (
          <Badge variant={tone} className="rounded-lg">
            {fmtDays(d)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "suggestedBoxes",
      header: "Order Boxes",
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          {row.original.suggestedBoxes}
        </span>
      ),
    },
    {
      accessorKey: "expectedDaysAfterOrder",
      header: "Days After Order",
      cell: ({ row }) => fmtDays(row.original.expectedDaysAfterOrder),
    },
  ];

  const exportRows = orderList.map((r) => ({
    item: r.name,
    boxes: r.suggestedBoxes,
    pieces: r.suggestedBoxes * r.piecesPerBox,
    expectedDays:
      r.expectedDaysAfterOrder === null
        ? "—"
        : r.expectedDaysAfterOrder.toFixed(1),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Refrigerator className="size-4" /> Fridge Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="h-11 rounded-xl text-lg font-bold"
            />
            <Label className="mt-1 text-xs text-muted-foreground">
              boxes total
            </Label>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="flex h-full flex-col justify-center p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Boxes className="size-4" /> Currently in fridge
            </p>
            <p className="text-2xl font-bold">{result.boxesUsed} boxes</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="flex h-full flex-col justify-center p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <PackageCheck className="size-4" /> Space available
            </p>
            <p className="text-2xl font-bold text-primary">
              {result.availableBoxes} boxes
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="flex h-full flex-col justify-center p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4" /> Suggested order
            </p>
            <p className="text-2xl font-bold text-primary">
              {result.totalSuggested} boxes
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Analysis (last {windowDays} days)
        </h2>
        <DataTable
          columns={columns}
          data={result.rows}
          searchPlaceholder="Search items…"
          emptyMessage="Add items and record some sales to get suggestions."
        />
      </div>

      <Card className="rounded-2xl border-primary/30 bg-primary/5">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" /> Supplier Order Sheet
          </CardTitle>
          {orderList.length > 0 && (
            <ExportButtons
              filename="lickees-order-sheet"
              title="Supplier Order Sheet"
              sheetName="Order"
              columns={[
                { header: "Item", key: "item" },
                { header: "Boxes", key: "boxes" },
                { header: "Pieces", key: "pieces" },
                { header: "Expected Days", key: "expectedDays" },
              ]}
              rows={exportRows}
              subtitleLines={[
                `Total boxes: ${result.totalSuggested} of ${result.availableBoxes} available (capacity ${result.fridgeCapacity})`,
              ]}
            />
          )}
        </CardHeader>
        <CardContent>
          {orderList.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No order needed right now, or there isn&apos;t enough sales history
              / fridge space to suggest one.
            </p>
          ) : (
            <ul className="divide-y">
              {orderList.map((r) => (
                <li
                  key={r.itemId}
                  className="flex items-center justify-between py-3"
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">
                      {r.suggestedBoxes} boxes
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({formatNumber(r.suggestedBoxes * r.piecesPerBox)} pcs)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
