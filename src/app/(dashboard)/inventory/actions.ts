"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";

export type ActionResult = { ok: boolean; error?: string };

function revalidate() {
  revalidatePath("/inventory");
  revalidatePath("/");
  revalidatePath("/planner");
  revalidatePath("/purchases");
  revalidatePath("/empty-boxes");
}

export async function createItem(
  name: string,
  piecesPerBox: number,
  sellingPrice = 0,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!name.trim()) return { ok: false, error: "Item name is required." };
  if (!piecesPerBox || piecesPerBox <= 0)
    return { ok: false, error: "Pieces per box must be greater than 0." };

  const base = {
    user_id: user.id,
    name: name.trim(),
    pieces_per_box: Math.floor(piecesPerBox),
  };
  const price = Math.max(0, Number(sellingPrice) || 0);

  let { error } = await supabase
    .from("inventory_items")
    .insert({ ...base, selling_price: price });
  if (error && error.code === "42703") {
    ({ error } = await supabase.from("inventory_items").insert(base));
  }
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "An item with this name already exists." : error.message,
    };
  }
  revalidate();
  return { ok: true };
}

export async function updateItem(
  id: string,
  name: string,
  piecesPerBox: number,
  sellingPrice = 0,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!name.trim()) return { ok: false, error: "Item name is required." };
  if (!piecesPerBox || piecesPerBox <= 0)
    return { ok: false, error: "Pieces per box must be greater than 0." };

  const base = {
    name: name.trim(),
    pieces_per_box: Math.floor(piecesPerBox),
  };
  const price = Math.max(0, Number(sellingPrice) || 0);

  let { error } = await supabase
    .from("inventory_items")
    .update({ ...base, selling_price: price })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error && error.code === "42703") {
    ({ error } = await supabase
      .from("inventory_items")
      .update(base)
      .eq("id", id)
      .eq("user_id", user.id));
  }
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
