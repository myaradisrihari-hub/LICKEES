"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";

export type ActionResult = { ok: boolean; error?: string };

function revalidate() {
  revalidatePath("/empty-boxes");
  revalidatePath("/inventory");
  revalidatePath("/");
  revalidatePath("/planner");
  revalidatePath("/reports");
}

export async function addEmptyBoxes(input: {
  itemId: string;
  emptyBoxes: number;
  piecesPerBox?: number;
  meltedPieces?: number;
  date: string;
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!input.itemId) return { ok: false, error: "Choose an item." };
  if (!input.emptyBoxes || input.emptyBoxes <= 0)
    return { ok: false, error: "Empty boxes must be greater than 0." };

  const ppb = Math.floor(input.piecesPerBox ?? 0);
  const melted = Math.max(0, Math.floor(input.meltedPieces ?? 0));
  if (ppb > 0 && melted > input.emptyBoxes * ppb)
    return { ok: false, error: "Melted pieces can't exceed the boxes' pieces." };

  const base = {
    user_id: user.id,
    item_id: input.itemId,
    empty_boxes: Math.floor(input.emptyBoxes),
    entry_date: input.date,
  };

  // Gracefully degrade if migration 0005 (melted_pieces / pieces_per_box) hasn't
  // been applied yet.
  let { error } = await supabase.from("empty_boxes").insert({
    ...base,
    melted_pieces: melted,
    pieces_per_box: ppb > 0 ? ppb : null,
  });
  if (error && error.code === "42703") {
    ({ error } = await supabase.from("empty_boxes").insert(base));
  }
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteEmptyBoxes(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("empty_boxes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
