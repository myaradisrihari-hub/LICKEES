import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/supabase/auth";
import type { ItemOption } from "@/components/item-select";
import { PurchaseManager, type PurchaseRow } from "./purchase-manager";

export const dynamic = "force-dynamic";

type PurchaseJoin = {
  id: string;
  entry_date: string;
  boxes: number;
  amount: number;
  inventory_items: {
    name: string;
    pieces_per_box: number;
    selling_price: number | null;
  } | null;
};

// Expected cost per the costing model: 65% of selling price.
const COST_RATIO = 0.65;

export default async function PurchasesPage() {
  const { supabase } = await requireUser();

  const [{ data: itemsData }, { data: historyData }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, pieces_per_box, selling_price")
      .order("name", { ascending: true }),
    supabase
      .from("stock_purchases")
      .select(
        "id, entry_date, boxes, amount, inventory_items(name, pieces_per_box, selling_price)",
      )
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const items: ItemOption[] = (itemsData ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    piecesPerBox: i.pieces_per_box,
    sellingPrice: i.selling_price ?? 0,
  }));

  const history: PurchaseRow[] = ((historyData ?? []) as PurchaseJoin[]).map(
    (p) => {
      const ppb = p.inventory_items?.pieces_per_box ?? 0;
      const price = p.inventory_items?.selling_price ?? 0;
      return {
        id: p.id,
        entry_date: p.entry_date,
        itemName: p.inventory_items?.name ?? "—",
        boxes: p.boxes,
        amount: p.amount,
        expectedCost: Math.round(p.boxes * ppb * price * COST_RATIO * 100) / 100,
      };
    },
  );

  return (
    <div>
      <PageHeader
        title="Stock Purchase"
        description="Record new stock as it arrives. Stock updates automatically."
      />
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Add an inventory item first, then record purchases here.
        </p>
      ) : (
        <PurchaseManager items={items} history={history} />
      )}
    </div>
  );
}
