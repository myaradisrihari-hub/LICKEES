"use client";

import { useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PackageOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, formatNumber, todayISO } from "@/lib/format";
import { ItemSelect, type ItemOption } from "@/components/item-select";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { addEmptyBoxes, deleteEmptyBoxes } from "./actions";

export interface EmptyBoxRow {
  id: string;
  entry_date: string;
  itemName: string;
  emptyBoxes: number;
  meltedPieces: number;
  soldPieces: number;
  profit: number;
}

export function EmptyBoxManager({
  items,
  history,
}: {
  items: ItemOption[];
  history: EmptyBoxRow[];
}) {
  const [itemId, setItemId] = useState("");
  const [boxes, setBoxes] = useState("");
  const [ppb, setPpb] = useState("");
  const [melted, setMelted] = useState("");
  // Default to today only on first render; never auto-reset afterwards.
  const [date, setDate] = useState(todayISO());
  const [pending, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function selectItem(id: string) {
    setItemId(id);
    const item = items.find((i) => i.id === id);
    // Default the pieces-per-box to the item's value; user can override.
    setPpb(item ? String(item.piecesPerBox) : "");
  }

  const soldPreview = useMemo(() => {
    const item = items.find((i) => i.id === itemId);
    if (!item || !boxes) return 0;
    const perBox = Number(ppb) || item.piecesPerBox;
    const gross = (Number(boxes) || 0) * perBox;
    return Math.max(gross - (Number(melted) || 0), 0);
  }, [itemId, boxes, ppb, melted, items]);

  function submit() {
    startTransition(async () => {
      const res = await addEmptyBoxes({
        itemId,
        emptyBoxes: Number(boxes),
        piecesPerBox: Number(ppb) || undefined,
        meltedPieces: Number(melted) || 0,
        date,
      });
      if (res.ok) {
        toast.success(`Recorded — ${soldPreview} pieces sold`);
        setItemId("");
        setBoxes("");
        setPpb("");
        setMelted("");
        // Keep the selected date for back-to-back older entries.
      } else {
        toast.error(res.error ?? "Could not save");
      }
    });
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    startDelete(async () => {
      const res = await deleteEmptyBoxes(id);
      if (res.ok) toast.success("Entry removed");
      else toast.error(res.error ?? "Could not delete");
      setPendingDeleteId(null);
    });
  }

  const columns: ColumnDef<EmptyBoxRow>[] = [
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
    { accessorKey: "emptyBoxes", header: "Empty Boxes" },
    {
      accessorKey: "meltedPieces",
      header: "Melted",
      cell: ({ row }) =>
        row.original.meltedPieces > 0 ? (
          <Badge variant="outline" className="rounded-lg text-rose-600">
            −{formatNumber(row.original.meltedPieces)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "soldPieces",
      header: "Sold Pieces",
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-lg">
          {formatNumber(row.original.soldPieces)}
        </Badge>
      ),
    },
    {
      accessorKey: "profit",
      header: "Profit",
      cell: ({ row }) =>
        row.original.profit > 0 ? (
          <span className="font-medium text-emerald-600">
            {formatCurrency(row.original.profit)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
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
            <PackageOpen className="size-5 text-primary" /> Empty box
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Item</Label>
            <ItemSelect items={items} value={itemId} onChange={selectItem} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eboxes">Number of empty boxes</Label>
            <Input
              id="eboxes"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="e.g. 2"
              value={boxes}
              onChange={(e) => setBoxes(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="eppb">Pieces per box</Label>
              <Input
                id="eppb"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="40"
                value={ppb}
                onChange={(e) => setPpb(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emelted">Melted pieces</Label>
              <Input
                id="emelted"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="0"
                value={melted}
                onChange={(e) => setMelted(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>
          <p className="-mt-1 text-xs text-muted-foreground">
            Sold = boxes × pieces per box − melted. Adjust melted to deduct
            spoiled pieces.
          </p>
          <div className="space-y-2">
            <Label htmlFor="edate">Date</Label>
            <Input
              id="edate"
              type="date"
              max={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Defaults to today — change it freely to log older sales.
            </p>
          </div>
          <div className="rounded-xl bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">Pieces sold</p>
            <p className="text-3xl font-bold text-primary">
              {formatNumber(soldPreview)}
            </p>
          </div>
          <div className="sticky bottom-24 z-10 lg:static lg:bottom-auto">
            <Button
              onClick={submit}
              disabled={pending}
              className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20 lg:shadow-none"
            >
              {pending ? "Saving…" : "Record empty boxes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        <DataTable
          columns={columns}
          data={history}
          searchPlaceholder="Search history…"
          emptyMessage="No empty boxes recorded yet."
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
