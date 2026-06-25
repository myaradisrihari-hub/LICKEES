"use client";

import { useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ItemStock } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { createItem, deleteItem, updateItem } from "./actions";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ItemDialog({
  trigger,
  initial,
  onSubmit,
}: {
  trigger: React.ReactNode;
  initial?: { name: string; piecesPerBox: number; sellingPrice: number };
  onSubmit: (
    name: string,
    piecesPerBox: number,
    sellingPrice: number,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [ppb, setPpb] = useState(initial?.piecesPerBox?.toString() ?? "");
  const [price, setPrice] = useState(
    initial?.sellingPrice ? initial.sellingPrice.toString() : "",
  );
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await onSubmit(name, Number(ppb), Number(price));
      if (res.ok) {
        toast.success("Saved");
        setOpen(false);
        if (!initial) {
          setName("");
          setPpb("");
          setPrice("");
        }
      } else {
        toast.error(res.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setName(initial?.name ?? "");
          setPpb(initial?.piecesPerBox?.toString() ?? "");
          setPrice(initial?.sellingPrice ? initial.sellingPrice.toString() : "");
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit item" : "New item"}</DialogTitle>
          <DialogDescription>
            Item name, pieces per box and the selling price per piece.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="item-name">Item name</Label>
            <Input
              id="item-name"
              placeholder="e.g. Mango Bar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-ppb">Pieces per box</Label>
            <Input
              id="item-ppb"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="e.g. 40"
              value={ppb}
              onChange={(e) => setPpb(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-price">Selling price / piece</Label>
            <Input
              id="item-price"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="e.g. 20"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-12 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              {Number(price) > 0
                ? `Cost ≈ ₹${(Number(price) * 0.65).toFixed(2)} (65%) · Profit ≈ ₹${(
                    Number(price) * 0.35
                  ).toFixed(2)} (35%) per piece`
                : "Cost is 65% of this, profit is 35% — no need to enter purchase amounts."}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={pending}
            className="h-11 w-full rounded-xl font-semibold sm:w-auto"
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InventoryManager({ items }: { items: ItemStock[] }) {
  const [deletePending, startTransition] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    startTransition(async () => {
      const res = await deleteItem(id);
      if (res.ok) toast.success("Item deleted");
      else toast.error(res.error ?? "Could not delete");
      setPendingDeleteId(null);
    });
  }

  const columns: ColumnDef<ItemStock>[] = [
    {
      accessorKey: "name",
      header: "Item",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "pieces_per_box",
      header: "Pcs / Box",
      cell: ({ row }) => formatNumber(row.original.pieces_per_box),
    },
    {
      accessorKey: "selling_price",
      header: "Price / Pc",
      cell: ({ row }) => formatCurrency(row.original.selling_price ?? 0),
    },
    {
      accessorKey: "remaining_pieces",
      header: "Remaining Pcs",
      cell: ({ row }) => {
        const v = row.original.remaining_pieces;
        return (
          <Badge
            variant={v <= 0 ? "destructive" : "secondary"}
            className="rounded-lg"
          >
            {formatNumber(v)}
          </Badge>
        );
      },
    },
    {
      id: "boxes_remaining",
      header: "Boxes Left",
      accessorFn: (r) =>
        r.pieces_per_box > 0 ? r.remaining_pieces / r.pieces_per_box : 0,
      cell: ({ row }) => {
        const r = row.original;
        const boxes = r.pieces_per_box > 0 ? r.remaining_pieces / r.pieces_per_box : 0;
        return `${boxes.toFixed(1)}`;
      },
    },
    {
      id: "melted_loss",
      header: "Melted Loss",
      accessorFn: (r) => {
        const cost =
          r.avg_cost_per_piece > 0
            ? r.avg_cost_per_piece
            : (r.selling_price ?? 0) * 0.65;
        return r.melted_pieces * cost;
      },
      cell: ({ row }) => {
        const r = row.original;
        const cost =
          r.avg_cost_per_piece > 0
            ? r.avg_cost_per_piece
            : (r.selling_price ?? 0) * 0.65;
        const loss = r.melted_pieces * cost;
        return loss > 0 ? (
          <span className="font-medium text-rose-600">
            {formatCurrency(loss)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({formatNumber(r.melted_pieces)} pcs)
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "inventory_value",
      header: "Value",
      cell: ({ row }) => formatCurrency(row.original.inventory_value),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <ItemDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-9 rounded-lg">
                <Pencil className="size-4" />
              </Button>
            }
            initial={{
              name: row.original.name,
              piecesPerBox: row.original.pieces_per_box,
              sellingPrice: row.original.selling_price ?? 0,
            }}
            onSubmit={(name, ppb, price) =>
              updateItem(row.original.item_id, name, ppb, price)
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg text-muted-foreground hover:text-destructive"
            onClick={() => setPendingDeleteId(row.original.item_id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ItemDialog
          trigger={
            <Button className="h-11 rounded-xl font-semibold">
              <Plus className="size-4" /> Add item
            </Button>
          }
          onSubmit={(name, ppb, price) => createItem(name, ppb, price)}
        />
      </div>
      <DataTable
        columns={columns}
        data={items}
        searchPlaceholder="Search items…"
        emptyMessage="No items yet. Add your first ice cream item."
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(o) => !o && setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        description="This also removes the item's stock history. This action cannot be undone."
        pending={deletePending}
      />
    </div>
  );
}
