// ---------------------------------------------------------------------------
// Business economics
//
// The shop buys ice cream at 65% of its sale price and keeps 35% as profit.
// So a piece that sells for ₹10 costs ₹6.5 and earns ₹3.5 profit.
// Only the *sale price* is entered (on the inventory item); cost and profit
// are derived from it — no need to type a purchase amount.
// ---------------------------------------------------------------------------

export const COST_RATIO = 0.65;
export const PROFIT_RATIO = Math.round((1 - COST_RATIO) * 100) / 100; // 0.35

/** Purchase cost for a piece, derived from its sale price. */
export function costPerPiece(sellingPrice: number): number {
  return (sellingPrice || 0) * COST_RATIO;
}

/** Estimated profit for a given ice cream sale value. */
export function profitFromRevenue(revenue: number): number {
  return (revenue || 0) * PROFIT_RATIO;
}
