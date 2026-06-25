import type { ItemStock } from "@/lib/types";

// ---------------------------------------------------------------------------
// Sales velocity & smart order planning
// ---------------------------------------------------------------------------

export interface SalesByItem {
  /** item_id -> total pieces sold within the analysis window */
  [itemId: string]: number;
}

export interface PlannerInput {
  stock: ItemStock[];
  /** pieces sold per item over the analysis window */
  soldPieces: SalesByItem;
  /** number of days the sales window covers (>= 1) */
  windowDays: number;
  /** total fridge capacity in boxes */
  fridgeCapacity: number;
}

export interface PlannerRow {
  itemId: string;
  name: string;
  piecesPerBox: number;
  remainingPieces: number;
  remainingBoxes: number;
  avgDailySales: number;
  daysRemaining: number | null; // null === effectively infinite (no sales)
  suggestedBoxes: number;
  expectedDaysAfterOrder: number | null;
}

export interface PlannerResult {
  rows: PlannerRow[];
  fridgeCapacity: number;
  boxesUsed: number;
  availableBoxes: number;
  totalSuggested: number;
}

/** Boxes physically occupied right now (a partial box still takes a slot). */
function occupiedBoxes(remainingPieces: number, piecesPerBox: number): number {
  if (remainingPieces <= 0 || piecesPerBox <= 0) return 0;
  return Math.ceil(remainingPieces / piecesPerBox);
}

/**
 * Distributes the available fridge capacity across items so that every item is
 * expected to run out at roughly the same time. Fast sellers get more boxes,
 * slow sellers get fewer, and items with no sales history get none.
 *
 * Uses a greedy allocation: each box is handed to whichever item would have the
 * fewest "days of stock" after receiving it. This naturally equalises the
 * projected finish dates while respecting integer boxes and total capacity.
 */
export function planOrder(input: PlannerInput): PlannerResult {
  const { stock, soldPieces, windowDays, fridgeCapacity } = input;
  const days = Math.max(1, windowDays);

  const working = stock.map((s) => {
    const avgDailySales = (soldPieces[s.item_id] ?? 0) / days;
    const remainingPieces = Math.max(0, s.remaining_pieces);
    return {
      itemId: s.item_id,
      name: s.name,
      piecesPerBox: s.pieces_per_box,
      remainingPieces,
      remainingBoxes: occupiedBoxes(remainingPieces, s.pieces_per_box),
      avgDailySales,
      allocated: 0,
    };
  });

  const boxesUsed = working.reduce((sum, w) => sum + w.remainingBoxes, 0);
  const availableBoxes = Math.max(0, Math.floor(fridgeCapacity) - boxesUsed);

  const sellable = working.filter((w) => w.avgDailySales > 0);

  for (let i = 0; i < availableBoxes && sellable.length > 0; i++) {
    // Pick the item whose projected days-of-stock would be lowest.
    let best = sellable[0];
    let bestDays = Infinity;
    for (const w of sellable) {
      const pieces = w.remainingPieces + w.allocated * w.piecesPerBox;
      const projected = pieces / w.avgDailySales;
      if (projected < bestDays) {
        bestDays = projected;
        best = w;
      }
    }
    best.allocated += 1;
  }

  const rows: PlannerRow[] = working.map((w) => {
    const daysRemaining =
      w.avgDailySales > 0 ? w.remainingPieces / w.avgDailySales : null;
    const piecesAfter = w.remainingPieces + w.allocated * w.piecesPerBox;
    const expectedDaysAfterOrder =
      w.avgDailySales > 0 ? piecesAfter / w.avgDailySales : null;
    return {
      itemId: w.itemId,
      name: w.name,
      piecesPerBox: w.piecesPerBox,
      remainingPieces: w.remainingPieces,
      remainingBoxes: w.remainingBoxes,
      avgDailySales: w.avgDailySales,
      daysRemaining,
      suggestedBoxes: w.allocated,
      expectedDaysAfterOrder,
    };
  });

  // Sort fastest sellers first for a useful, readable order sheet.
  rows.sort((a, b) => b.avgDailySales - a.avgDailySales);

  return {
    rows,
    fridgeCapacity: Math.floor(fridgeCapacity),
    boxesUsed,
    availableBoxes,
    totalSuggested: rows.reduce((sum, r) => sum + r.suggestedBoxes, 0),
  };
}

// ---------------------------------------------------------------------------
// Generic month helpers
// ---------------------------------------------------------------------------

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}
