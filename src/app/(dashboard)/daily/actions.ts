"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";

export interface ExpenseInput {
  amount: number;
  reason: string;
}

export interface SaveDailyInput {
  date: string;
  cashRevenue: number;
  onlineRevenue: number;
  note?: string;
  expenses: ExpenseInput[];
}

export type ActionResult = { ok: boolean; error?: string };

export async function saveDailyEntry(
  input: SaveDailyInput,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  if (!input.date) return { ok: false, error: "Date is required." };

  const baseRevenue = {
    user_id: user.id,
    entry_date: input.date,
    cash_revenue: Number(input.cashRevenue) || 0,
    online_revenue: Number(input.onlineRevenue) || 0,
  };
  const note = input.note?.trim() ? input.note.trim() : null;

  let { error: revErr } = await supabase
    .from("daily_revenue")
    .upsert({ ...baseRevenue, note }, { onConflict: "user_id,entry_date" });
  // Gracefully fall back if the `note` column hasn't been migrated yet.
  if (revErr && revErr.code === "42703") {
    ({ error: revErr } = await supabase
      .from("daily_revenue")
      .upsert(baseRevenue, { onConflict: "user_id,entry_date" }));
  }
  if (revErr) return { ok: false, error: revErr.message };

  // Replace the day's expenses so re-saving is idempotent.
  const { error: delErr } = await supabase
    .from("expenses")
    .delete()
    .eq("user_id", user.id)
    .eq("entry_date", input.date);
  if (delErr) return { ok: false, error: delErr.message };

  const rows = input.expenses
    .filter((e) => e.reason.trim() !== "" && Number(e.amount) > 0)
    .map((e) => ({
      user_id: user.id,
      entry_date: input.date,
      amount: Number(e.amount),
      reason: e.reason.trim(),
    }));

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from("expenses").insert(rows);
    if (insErr) return { ok: false, error: insErr.message };
  }

  revalidatePath("/daily");
  revalidatePath("/");
  revalidatePath("/reports");
  return { ok: true };
}
