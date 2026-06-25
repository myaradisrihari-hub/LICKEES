"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";

export type ActionResult = { ok: boolean; error?: string };

export async function updateSettings(input: {
  shopName: string;
  fridgeCapacity: number;
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!input.fridgeCapacity || input.fridgeCapacity <= 0)
    return { ok: false, error: "Fridge capacity must be greater than 0." };

  const { error } = await supabase.from("app_settings").upsert(
    {
      user_id: user.id,
      shop_name: input.shopName.trim() || "My Shop",
      fridge_capacity: Math.floor(input.fridgeCapacity),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/planner");
  return { ok: true };
}
