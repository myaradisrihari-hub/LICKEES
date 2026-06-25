import {
  format,
  subDays,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { DailyPnl, ItemStock, WastageReason } from "@/lib/types";

export interface SeriesPoint {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface TopSeller {
  name: string;
  pieces: number;
}

export interface DashboardData {
  month: {
    iceCreamRevenue: number; // sold pieces × selling price
    iceCreamProfit: number; // 35% of ice cream revenue
    totalRevenue: number; // Daily Entry revenue only (ice cream already inside)
    expenses: number;
    netProfit: number; // total revenue - expenses
    piecesSold: number;
    stockPurchaseValue: number;
    avgDailyIncome: number; // revenue ÷ days with entries this month
    meltedCost: number; // melted pieces × bought price this month
  };
  inventory: {
    value: number;
    remainingPieces: number;
    equivalentBoxes: number;
    avgDailySales: number; // pieces/day so far this month
  };
  topSeller: { name: string; pieces: number } | null;
  mostPurchased: { name: string; boxes: number } | null;
  charts: {
    revenueTrend: { label: string; revenue: number }[];
    expensesTrend: { label: string; expenses: number }[];
    profitTrend: { label: string; profit: number }[];
    purchaseTrend: { label: string; amount: number }[];
    topSellers: TopSeller[];
    inventoryDistribution: { name: string; value: number }[];
    monthlyComparison: { name: string; current: number; previous: number }[];
  };
}

function monthPrefix(d: Date): string {
  return format(d, "yyyy-MM");
}

// cost = 65% of selling price, profit = 35% of selling price
const COST_RATIO = 0.65;
const PROFIT_RATIO = 0.35;

type PriceInfo = { ppb: number; price: number; cost: number; name: string };
type EmptyBoxRow = {
  item_id: string;
  empty_boxes: number;
  entry_date: string;
  melted_pieces?: number | null;
  pieces_per_box?: number | null;
};
type PurchaseRow = {
  item_id: string;
  boxes: number;
  amount: number;
  entry_date: string;
};

/**
 * Net sold pieces per item for a period, honoring empty-box logic:
 *   sold = max(empty_boxes * pieces_per_box - melted_pieces, 0)
 * Melted pieces (recorded per empty-box entry) only reduce the sold count and
 * never push it negative.
 */
function netSoldByItem(
  empties: EmptyBoxRow[],
  priceByItem: Map<string, PriceInfo>,
  inPeriod: (date: string) => boolean,
): Map<string, number> {
  const net = new Map<string, number>();
  empties.forEach((e) => {
    if (!inPeriod(e.entry_date)) return;
    const info = priceByItem.get(e.item_id);
    if (!info) return;
    const perBox = e.pieces_per_box ?? info.ppb;
    const sold = Math.max(e.empty_boxes * perBox - (e.melted_pieces ?? 0), 0);
    net.set(e.item_id, (net.get(e.item_id) ?? 0) + sold);
  });
  return net;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const now = new Date();
  const thisMonth = monthPrefix(now);
  const prevMonth = monthPrefix(subMonths(now, 1));
  const sixMonthsStart = format(
    startOfMonth(subMonths(now, 5)),
    "yyyy-MM-dd",
  );

  const [
    { data: pnlData },
    { data: stockData },
    { data: emptyData },
    { data: purchaseData },
  ] = await Promise.all([
    supabase
      .from("daily_pnl")
      .select("entry_date, revenue, expenses, profit")
      .order("entry_date", { ascending: true }),
    supabase.from("item_stock").select("*"),
    // select * so it works before/after the melted_pieces + pieces_per_box migration
    supabase.from("empty_boxes").select("*").gte("entry_date", sixMonthsStart),
    supabase
      .from("stock_purchases")
      .select("item_id, boxes, amount, entry_date")
      .gte("entry_date", sixMonthsStart),
  ]);

  const pnl = (pnlData ?? []) as DailyPnl[];
  const stock = (stockData ?? []) as ItemStock[];
  const empties = (emptyData ?? []) as EmptyBoxRow[];
  const purchases = (purchaseData ?? []) as PurchaseRow[];

  // Selling price per piece is entered on the item in Inventory.
  // cost = 65% of selling price, profit = 35%.
  const priceByItem = new Map<string, PriceInfo>();
  stock.forEach((s) => {
    const price = s.selling_price ?? 0;
    priceByItem.set(s.item_id, {
      ppb: s.pieces_per_box,
      price,
      cost: price * COST_RATIO,
      name: s.name,
    });
  });

  const inMonth = (d: string) => d.startsWith(thisMonth);
  const inPrev = (d: string) => d.startsWith(prevMonth);

  // Estimated value of stock bought in a period: use the entered amount if any,
  // otherwise derive it from the cost (65% of selling price).
  const purchaseValueOf = (rows: PurchaseRow[]) =>
    rows.reduce((sum, p) => {
      if (p.amount > 0) return sum + p.amount;
      const info = priceByItem.get(p.item_id);
      return sum + (info ? p.boxes * info.ppb * info.cost : 0);
    }, 0);

  // ---- This-month money figures -----------------------------------------
  const monthPnl = pnl.filter((p) => inMonth(p.entry_date));
  // Total revenue = Daily Entry only (ice cream cash is already counted there).
  const totalRevenue = monthPnl.reduce((s, p) => s + p.revenue, 0);
  const expenses = monthPnl.reduce((s, p) => s + p.expenses, 0);

  const monthNetSold = netSoldByItem(empties, priceByItem, inMonth);
  let iceCreamRevenue = 0;
  let monthlyPiecesSold = 0;
  monthNetSold.forEach((pieces, id) => {
    iceCreamRevenue += pieces * (priceByItem.get(id)?.price ?? 0);
    monthlyPiecesSold += pieces;
  });
  iceCreamRevenue = Math.round(iceCreamRevenue * 100) / 100;

  // Displayed "pieces sold" matches the Inventory tab, which is all-time net
  // sold from the item_stock view (sold_pieces already nets out melted).
  const piecesSold = stock.reduce((s, i) => s + Math.max(0, i.sold_pieces), 0);

  const stockPurchaseValue = Math.round(
    purchaseValueOf(purchases.filter((p) => inMonth(p.entry_date))) * 100,
  ) / 100;

  // Average daily income = month revenue ÷ number of days with a daily entry.
  const activeDays = monthPnl.filter((p) => p.revenue > 0).length;
  const avgDailyIncome =
    activeDays > 0 ? Math.round((totalRevenue / activeDays) * 100) / 100 : 0;

  // Melted cost = melted pieces (from empty boxes) valued at the bought / cost
  // price per piece, for the current month.
  const costByItem = new Map<string, number>();
  stock.forEach((s) =>
    costByItem.set(
      s.item_id,
      s.avg_cost_per_piece > 0 ? s.avg_cost_per_piece : (s.selling_price ?? 0) * COST_RATIO,
    ),
  );
  const meltedCost =
    Math.round(
      empties.reduce((sum, e) => {
        if (!inMonth(e.entry_date)) return sum;
        return sum + (e.melted_pieces ?? 0) * (costByItem.get(e.item_id) ?? 0);
      }, 0) * 100,
    ) / 100;

  const monthData = {
    iceCreamRevenue,
    iceCreamProfit: Math.round(iceCreamRevenue * PROFIT_RATIO * 100) / 100,
    totalRevenue,
    expenses,
    netProfit: totalRevenue - expenses,
    piecesSold,
    stockPurchaseValue,
    avgDailyIncome,
    meltedCost,
  };

  // ---- Inventory snapshot -----------------------------------------------
  const inventoryValue = stock.reduce((s, i) => s + i.inventory_value, 0);
  const remainingPieces = stock.reduce(
    (s, i) => s + Math.max(0, i.remaining_pieces),
    0,
  );
  const equivalentBoxes = stock.reduce(
    (s, i) =>
      s + (i.pieces_per_box > 0 ? Math.max(0, i.remaining_pieces) / i.pieces_per_box : 0),
    0,
  );

  // Average daily sales = this month's net sold pieces / days elapsed.
  const dayOfMonth = now.getDate();
  const avgDailySales =
    dayOfMonth > 0 ? Math.round((monthlyPiecesSold / dayOfMonth) * 10) / 10 : 0;

  // ---- Top seller (this month) & most purchased (this month) ------------
  const topSellerEntry = [...monthNetSold.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0];
  const topSeller = topSellerEntry
    ? {
        name: priceByItem.get(topSellerEntry[0])?.name ?? "—",
        pieces: topSellerEntry[1],
      }
    : null;

  const purchasedBoxesByItem = new Map<string, number>();
  purchases
    .filter((p) => inMonth(p.entry_date))
    .forEach((p) =>
      purchasedBoxesByItem.set(
        p.item_id,
        (purchasedBoxesByItem.get(p.item_id) ?? 0) + p.boxes,
      ),
    );
  const mostPurchasedEntry = [...purchasedBoxesByItem.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0];
  const mostPurchased = mostPurchasedEntry
    ? {
        name: priceByItem.get(mostPurchasedEntry[0])?.name ?? "—",
        boxes: mostPurchasedEntry[1],
      }
    : null;

  // ---- 6-month trends ----------------------------------------------------
  const months = Array.from({ length: 6 }).map((_, idx) => {
    const d = subMonths(now, 5 - idx);
    return { key: monthPrefix(d), label: format(d, "MMM") };
  });

  const revenueTrend: { label: string; revenue: number }[] = [];
  const expensesTrend: { label: string; expenses: number }[] = [];
  const profitTrend: { label: string; profit: number }[] = [];
  const purchaseTrend: { label: string; amount: number }[] = [];

  months.forEach(({ key, label }) => {
    const inThis = (d: string) => d.startsWith(key);
    const rows = pnl.filter((p) => inThis(p.entry_date));
    const total = rows.reduce((s, p) => s + p.revenue, 0);
    const exp = rows.reduce((s, p) => s + p.expenses, 0);
    revenueTrend.push({ label, revenue: Math.round(total * 100) / 100 });
    expensesTrend.push({ label, expenses: exp });
    profitTrend.push({ label, profit: Math.round((total - exp) * 100) / 100 });
    purchaseTrend.push({
      label,
      amount:
        Math.round(
          purchaseValueOf(purchases.filter((p) => inThis(p.entry_date))) * 100,
        ) / 100,
    });
  });

  // ---- Top sellers (this month) & inventory distribution ----------------
  const topSellers: TopSeller[] = [...monthNetSold.entries()]
    .map(([id, pieces]) => ({ name: priceByItem.get(id)?.name ?? "—", pieces }))
    .filter((s) => s.pieces > 0)
    .sort((a, b) => b.pieces - a.pieces)
    .slice(0, 6);

  const inventoryDistribution = [...stock]
    .filter((s) => s.inventory_value > 0)
    .sort((a, b) => b.inventory_value - a.inventory_value)
    .slice(0, 6)
    .map((s) => ({ name: s.name, value: Math.round(s.inventory_value) }));

  // ---- Monthly comparison (this vs previous) ----------------------------
  const prevPnl = pnl.filter((p) => inPrev(p.entry_date));
  const prevTotal = prevPnl.reduce((s, p) => s + p.revenue, 0);
  const prevExp = prevPnl.reduce((s, p) => s + p.expenses, 0);

  const monthlyComparison = [
    { name: "Revenue", current: Math.round(totalRevenue), previous: Math.round(prevTotal) },
    { name: "Expenses", current: Math.round(expenses), previous: Math.round(prevExp) },
    {
      name: "Profit",
      current: Math.round(totalRevenue - expenses),
      previous: Math.round(prevTotal - prevExp),
    },
  ];

  return {
    month: monthData,
    inventory: {
      value: inventoryValue,
      remainingPieces,
      equivalentBoxes,
      avgDailySales,
    },
    topSeller,
    mostPurchased,
    charts: {
      revenueTrend,
      expensesTrend,
      profitTrend,
      purchaseTrend,
      topSellers,
      inventoryDistribution,
      monthlyComparison,
    },
  };
}

// ---------------------------------------------------------------------------
// Inventory analytics
// ---------------------------------------------------------------------------

export interface InventoryAnalytics {
  currentValue: number;
  monthlyPurchaseValue: number;
  totalPiecesPurchased: number;
  totalPiecesSold: number;
  remainingPieces: number;
  equivalentBoxes: number;
  avgDailySales: number;
  topSelling: { name: string; pieces: number } | null;
  slowestSelling: { name: string; pieces: number } | null;
  stockUtilization: number; // %
  health: "Excellent" | "Healthy" | "Low" | "Critical" | "Empty";
}

export async function getInventoryAnalytics(): Promise<InventoryAnalytics> {
  const supabase = await createClient();
  const now = new Date();
  const thisMonth = monthPrefix(now);
  const monthStart = `${thisMonth}-01`;

  const [{ data: stockData }, { data: purchaseData }] = await Promise.all([
    supabase.from("item_stock").select("*"),
    supabase
      .from("stock_purchases")
      .select("item_id, boxes, amount, entry_date")
      .gte("entry_date", monthStart),
  ]);

  const stock = (stockData ?? []) as ItemStock[];
  const purchases = (purchaseData ?? []) as {
    item_id: string;
    boxes: number;
    amount: number;
    entry_date: string;
  }[];

  // cost per piece = 65% of selling price (purchase amount is optional)
  const costByItem = new Map<string, number>(
    stock.map((s) => [s.item_id, (s.selling_price ?? 0) * 0.65]),
  );

  const currentValue = stock.reduce((s, i) => s + i.inventory_value, 0);
  const monthlyPurchaseValue = purchases.reduce((s, p) => {
    if (p.amount > 0) return s + p.amount;
    const ppb =
      stock.find((i) => i.item_id === p.item_id)?.pieces_per_box ?? 0;
    return s + p.boxes * ppb * (costByItem.get(p.item_id) ?? 0);
  }, 0);
  const totalPiecesPurchased = stock.reduce((s, i) => s + i.purchased_pieces, 0);
  const totalPiecesSold = stock.reduce((s, i) => s + i.sold_pieces, 0);
  const remainingPieces = stock.reduce(
    (s, i) => s + Math.max(0, i.remaining_pieces),
    0,
  );
  const equivalentBoxes = stock.reduce(
    (s, i) =>
      s + (i.pieces_per_box > 0 ? Math.max(0, i.remaining_pieces) / i.pieces_per_box : 0),
    0,
  );

  const dayOfMonth = now.getDate();
  const avgDailySales =
    dayOfMonth > 0 ? totalPiecesSold === 0 ? 0 : totalPiecesSold / dayOfMonth : 0;

  const sellers = [...stock]
    .filter((s) => s.purchased_pieces > 0)
    .map((s) => ({ name: s.name, pieces: s.sold_pieces }));
  const topSelling = sellers.length
    ? sellers.reduce((a, b) => (b.pieces > a.pieces ? b : a))
    : null;
  const slowestSelling = sellers.length
    ? sellers.reduce((a, b) => (b.pieces < a.pieces ? b : a))
    : null;

  const stockUtilization =
    totalPiecesPurchased > 0
      ? Math.round((totalPiecesSold / totalPiecesPurchased) * 100)
      : 0;

  let health: InventoryAnalytics["health"] = "Healthy";
  if (remainingPieces <= 0) health = "Empty";
  else if (equivalentBoxes < 3) health = "Critical";
  else if (equivalentBoxes < 8) health = "Low";
  else if (stockUtilization >= 60) health = "Excellent";

  return {
    currentValue,
    monthlyPurchaseValue,
    totalPiecesPurchased,
    totalPiecesSold,
    remainingPieces,
    equivalentBoxes,
    avgDailySales,
    topSelling,
    slowestSelling,
    stockUtilization,
    health,
  };
}

// ---------------------------------------------------------------------------
// Monthly report
// ---------------------------------------------------------------------------

export interface MonthlyReport {
  month: string; // yyyy-MM
  revenue: number;
  expenses: number;
  profit: number;
  avgDailyIncome: number;
  highestSalesDay: { date: string; revenue: number } | null;
  topSellers: TopSeller[];
  expensesByReason: { reason: string; amount: number; count: number }[];
  wastage: { reason: WastageReason; quantity: number; loss: number }[];
  totalWastageLoss: number;
  prev: { revenue: number; expenses: number; profit: number };
  dailySeries: { date: string; revenue: number; expenses: number; profit: number }[];
}

export async function getMonthlyReport(month: string): Promise<MonthlyReport> {
  const supabase = await createClient();
  const monthStart = `${month}-01`;
  const start = new Date(`${month}-01T00:00:00`);
  const end = endOfMonth(start);
  const prevMonth = monthPrefix(subMonths(start, 1));

  const [
    { data: pnlData },
    { data: stockData },
    { data: emptyData },
    { data: dmgData },
    { data: expData },
  ] = await Promise.all([
    supabase
      .from("daily_pnl")
      .select("entry_date, revenue, expenses, profit")
      .gte("entry_date", monthPrefix(subMonths(start, 1)) + "-01")
      .lte("entry_date", format(end, "yyyy-MM-dd"))
      .order("entry_date", { ascending: true }),
    supabase.from("item_stock").select("item_id, name, pieces_per_box, avg_cost_per_piece"),
    supabase
      .from("empty_boxes")
      .select("*, inventory_items(name, pieces_per_box)")
      .gte("entry_date", monthStart)
      .lte("entry_date", format(end, "yyyy-MM-dd")),
    supabase
      .from("damaged_stock")
      .select("quantity, reason, item_id, entry_date")
      .gte("entry_date", monthStart)
      .lte("entry_date", format(end, "yyyy-MM-dd")),
    supabase
      .from("expenses")
      .select("amount, reason, entry_date")
      .gte("entry_date", monthStart)
      .lte("entry_date", format(end, "yyyy-MM-dd")),
  ]);

  const pnl = (pnlData ?? []) as DailyPnl[];
  const thisRows = pnl.filter((p) => p.entry_date.startsWith(month));
  const prevRows = pnl.filter((p) => p.entry_date.startsWith(prevMonth));

  const totals = thisRows.reduce(
    (a, p) => ({
      revenue: a.revenue + p.revenue,
      expenses: a.expenses + p.expenses,
      profit: a.profit + p.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 },
  );
  const prev = prevRows.reduce(
    (a, p) => ({
      revenue: a.revenue + p.revenue,
      expenses: a.expenses + p.expenses,
      profit: a.profit + p.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 },
  );

  const activeDays = thisRows.filter((p) => p.revenue > 0).length;
  const avgDailyIncome = activeDays > 0 ? totals.revenue / activeDays : 0;

  const highest = thisRows.reduce<{ date: string; revenue: number } | null>(
    (best, p) =>
      !best || p.revenue > best.revenue
        ? { date: p.entry_date, revenue: p.revenue }
        : best,
    null,
  );
  const highestSalesDay = highest && highest.revenue > 0 ? highest : null;

  // Top sellers this month (from empty boxes) ------------------------------
  type EmptyJoin = {
    empty_boxes: number;
    item_id: string;
    melted_pieces?: number | null;
    pieces_per_box?: number | null;
    inventory_items: { name: string; pieces_per_box: number } | null;
  };
  const sellerMap = new Map<string, { name: string; pieces: number }>();
  ((emptyData ?? []) as EmptyJoin[]).forEach((e) => {
    const name = e.inventory_items?.name ?? "—";
    const ppb = e.pieces_per_box ?? e.inventory_items?.pieces_per_box ?? 0;
    const sold = Math.max(e.empty_boxes * ppb - (e.melted_pieces ?? 0), 0);
    const cur = sellerMap.get(e.item_id) ?? { name, pieces: 0 };
    cur.pieces += sold;
    sellerMap.set(e.item_id, cur);
  });
  const topSellers: TopSeller[] = [...sellerMap.values()]
    .sort((a, b) => b.pieces - a.pieces)
    .slice(0, 5);

  // Wastage by reason ------------------------------------------------------
  const costMap = new Map<string, number>();
  ((stockData ?? []) as Pick<ItemStock, "item_id" | "avg_cost_per_piece">[]).forEach(
    (s) => costMap.set(s.item_id, s.avg_cost_per_piece),
  );
  type DmgRow = { quantity: number; reason: WastageReason; item_id: string };
  const wasteMap = new Map<WastageReason, { quantity: number; loss: number }>();
  ((dmgData ?? []) as DmgRow[]).forEach((d) => {
    const cur = wasteMap.get(d.reason) ?? { quantity: 0, loss: 0 };
    cur.quantity += d.quantity;
    cur.loss += d.quantity * (costMap.get(d.item_id) ?? 0);
    wasteMap.set(d.reason, cur);
  });
  const wastage = [...wasteMap.entries()].map(([reason, v]) => ({
    reason,
    quantity: v.quantity,
    loss: v.loss,
  }));
  const totalWastageLoss = wastage.reduce((s, w) => s + w.loss, 0);

  // Expenses grouped by reason -------------------------------------------
  type ExpRow = { amount: number; reason: string | null };
  const expMap = new Map<string, { amount: number; count: number }>();
  ((expData ?? []) as ExpRow[]).forEach((e) => {
    const reason = e.reason?.trim() || "Uncategorized";
    const cur = expMap.get(reason) ?? { amount: 0, count: 0 };
    cur.amount += Number(e.amount) || 0;
    cur.count += 1;
    expMap.set(reason, cur);
  });
  const expensesByReason = [...expMap.entries()]
    .map(([reason, v]) => ({ reason, amount: v.amount, count: v.count }))
    .sort((a, b) => b.amount - a.amount);

  // Daily series for the month --------------------------------------------
  const byDate = new Map<string, DailyPnl>();
  thisRows.forEach((p) => byDate.set(p.entry_date, p));
  const dailySeries = eachDayOfInterval({
    start: startOfMonth(start),
    end,
  }).map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const row = byDate.get(key);
    return {
      date: key,
      revenue: row?.revenue ?? 0,
      expenses: row?.expenses ?? 0,
      profit: row?.profit ?? 0,
    };
  });

  return {
    month,
    revenue: totals.revenue,
    expenses: totals.expenses,
    profit: totals.profit,
    avgDailyIncome,
    highestSalesDay,
    topSellers,
    expensesByReason,
    wastage,
    totalWastageLoss,
    prev,
    dailySeries,
  };
}

// ---------------------------------------------------------------------------
// Planner data: stock + recent sales velocity
// ---------------------------------------------------------------------------

export interface PlannerData {
  stock: ItemStock[];
  soldPieces: Record<string, number>;
  windowDays: number;
}

export async function getPlannerData(windowDays = 30): Promise<PlannerData> {
  const supabase = await createClient();
  const since = format(subDays(new Date(), windowDays - 1), "yyyy-MM-dd");

  const [{ data: stockData }, { data: emptyData }] = await Promise.all([
    supabase.from("item_stock").select("*").order("name", { ascending: true }),
    supabase
      .from("empty_boxes")
      .select("empty_boxes, item_id, inventory_items(pieces_per_box)")
      .gte("entry_date", since),
  ]);

  type EmptyJoin = {
    empty_boxes: number;
    item_id: string;
    inventory_items: { pieces_per_box: number } | null;
  };

  const soldPieces: Record<string, number> = {};
  ((emptyData ?? []) as EmptyJoin[]).forEach((e) => {
    const ppb = e.inventory_items?.pieces_per_box ?? 0;
    soldPieces[e.item_id] = (soldPieces[e.item_id] ?? 0) + e.empty_boxes * ppb;
  });

  return {
    stock: (stockData ?? []) as ItemStock[],
    soldPieces,
    windowDays,
  };
}
