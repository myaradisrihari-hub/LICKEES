"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";

export type ActionResult = { ok: boolean; error?: string };

export async function addPurchase(input: {
  itemId: string;
  boxes: number;
  amount: number;
  date: string;
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!input.itemId) return { ok: false, error: "Choose an item." };
  if (!input.boxes || input.boxes <= 0)
    return { ok: false, error: "Boxes must be greater than 0." };

  const { error } = await supabase.from("stock_purchases").insert({
    user_id: user.id,
    item_id: input.itemId,
    boxes: Math.floor(input.boxes),
    amount: Number(input.amount) || 0,
    entry_date: input.date,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/");
  revalidatePath("/planner");
  return { ok: true };
}

export async function deletePurchase(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("stock_purchases")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/planner");
  return { ok: true };
}
