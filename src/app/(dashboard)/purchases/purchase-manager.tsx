"use client";

import { useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PackagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import { ItemSelect, type ItemOption } from "@/components/item-select";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { addPurchase, deletePurchase } from "./actions";

export interface PurchaseRow {
  id: string;
  entry_date: string;
  itemName: string;
  boxes: number;
  amount: number;
  /** 65% of selling price for the boxes — what the cost should be. */
  expectedCost: number;
}

const COST_RATIO = 0.65;

export function PurchaseManager({
  items,
  history,
}: {
  items: ItemOption[];
  history: PurchaseRow[];
}) {
  const [itemId, setItemId] = useState("");
  const [boxes, setBoxes] = useState("");
  const [amount, setAmount] = useState("");
  // Default to today only on first render; never auto-reset afterwards.
  const [date, setDate] = useState(todayISO());
  const [pending, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Live "expected cost" = boxes × pieces/box × selling price × 65%.
  const expectedCost = useMemo(() => {
    const item = items.find((i) => i.id === itemId);
    if (!item || !boxes) return 0;
    const value =
      (Number(boxes) || 0) * item.piecesPerBox * (item.sellingPrice ?? 0) * COST_RATIO;
    return Math.round(value * 100) / 100;
  }, [itemId, boxes, items]);

  function submit() {
    startTransition(async () => {
      const res = await addPurchase({
        itemId,
        boxes: Number(boxes),
        amount: Number(amount),
        date,
      });
      if (res.ok) {
        toast.success("Stock purchase recorded");
        setItemId("");
        setBoxes("");
        setAmount("");
        // Keep the selected date so old entries can be added back-to-back.
      } else {
        toast.error(res.error ?? "Could not save");
      }
    });
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    startDelete(async () => {
      const res = await deletePurchase(id);
      if (res.ok) toast.success("Purchase removed");
      else toast.error(res.error ?? "Could not delete");
      setPendingDeleteId(null);
    });
  }

  const columns: ColumnDef<PurchaseRow>[] = [
    {
      accessorKey: "entry_date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.entry_date),
    },
    {
      accessorKey: "itemName",
      header: "Item",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.itemName}</span>
      ),
    },
    { accessorKey: "boxes", header: "Boxes" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const { amount, expectedCost } = row.original;
        // A blank/zero amount falls back to 65% automatically, so only flag a
        // recorded amount that differs from the expected 65% cost.
        const off =
          amount > 0 &&
          expectedCost > 0 &&
          Math.round(amount) !== Math.round(expectedCost);
        return (
          <span className={cn("font-medium", off && "text-red-600")}>
            {formatCurrency(amount)}
            {off && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (exp. {formatCurrency(expectedCost)})
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg text-muted-foreground hover:text-destructive"
            onClick={() => setPendingDeleteId(row.original.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="rounded-2xl lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="size-5 text-primary" /> New stock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Item</Label>
            <ItemSelect items={items} value={itemId} onChange={setItemId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="boxes">Boxes purchased</Label>
            <Input
              id="boxes"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="e.g. 10"
              value={boxes}
              onChange={(e) => setBoxes(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Purchase amount (optional)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="Leave blank — auto 65% of selling price"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Optional — cost is taken as 65% of the item&apos;s selling price.
            </p>
          </div>
          {expectedCost > 0 && (
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Expected cost (65% of selling price)
              </p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(expectedCost)}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="pdate">Date</Label>
            <Input
              id="pdate"
              type="date"
              max={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Defaults to today — change it freely to log older purchases.
            </p>
          </div>
          <div className="sticky bottom-24 z-10 lg:static lg:bottom-auto">
            <Button
              onClick={submit}
              disabled={pending}
              className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20 lg:shadow-none"
            >
              {pending ? "Saving…" : "Record purchase"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <h2 className="mb-3 text-lg font-semibold">Purchase history</h2>
        <DataTable
          columns={columns}
          data={history}
          searchPlaceholder="Search purchases…"
          emptyMessage="No purchases recorded yet."
        />
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(o) => !o && setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        pending={deletePending}
      />
    </div>
  );
}
