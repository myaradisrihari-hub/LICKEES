import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/supabase/auth";
import type { ItemOption } from "@/components/item-select";
import { EmptyBoxManager, type EmptyBoxRow } from "./empty-box-manager";

export const dynamic = "force-dynamic";

type EmptyBoxJoin = {
  id: string;
  entry_date: string;
  empty_boxes: number;
  melted_pieces?: number | null;
  pieces_per_box?: number | null;
  inventory_items: {
    name: string;
    pieces_per_box: number;
    selling_price: number | null;
  } | null;
};

// Profit per piece = 35% of selling price.
const PROFIT_RATIO = 0.35;

export default async function EmptyBoxesPage() {
  const { supabase } = await requireUser();

  const [{ data: itemsData }, { data: historyData }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, pieces_per_box, selling_price")
      .order("name", { ascending: true }),
    supabase
      .from("empty_boxes")
      .select("*, inventory_items(name, pieces_per_box, selling_price)")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const items: ItemOption[] = (itemsData ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    piecesPerBox: i.pieces_per_box,
    sellingPrice: i.selling_price ?? 0,
  }));

  const history: EmptyBoxRow[] = ((historyData ?? []) as EmptyBoxJoin[]).map(
    (e) => {
      const ppb = e.pieces_per_box ?? e.inventory_items?.pieces_per_box ?? 0;
      const melted = e.melted_pieces ?? 0;
      const price = e.inventory_items?.selling_price ?? 0;
      const soldPieces = Math.max(e.empty_boxes * ppb - melted, 0);
      return {
        id: e.id,
        entry_date: e.entry_date,
        itemName: e.inventory_items?.name ?? "—",
        emptyBoxes: e.empty_boxes,
        meltedPieces: melted,
        soldPieces,
        profit: Math.round(soldPieces * price * PROFIT_RATIO * 100) / 100,
      };
    },
  );

  return (
    <div>
      <PageHeader
        title="Empty Boxes"
        description="When a box empties, log it here — sold pieces are calculated for you."
      />
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Add an inventory item first to start tracking sales.
        </p>
      ) : (
        <EmptyBoxManager items={items} history={history} />
      )}
    </div>
  );
}
