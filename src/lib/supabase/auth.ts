import { createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";

/**
 * This app runs without authentication — a single shop owner.
 * Every row is tagged with this fixed owner id.
 */
export const OWNER_ID = "00000000-0000-0000-0000-000000000001";

/** Returns the Supabase client and the fixed single owner. */
export async function requireUser() {
  const supabase = await createClient();
  return { supabase, user: { id: OWNER_ID, email: "" } };
}

/** Fetches (or lazily creates) the owner's app settings. */
export async function getSettings(): Promise<AppSettings> {
  const { supabase } = await requireUser();

  const { data } = await supabase
    .from("app_settings")
    .select("*")
    .eq("user_id", OWNER_ID)
    .maybeSingle();

  if (data) return data;

  const fallback: AppSettings = {
    user_id: OWNER_ID,
    shop_name: "My Shop",
    fridge_capacity: 100,
    currency: "INR",
    updated_at: new Date().toISOString(),
  };

  const { data: created } = await supabase
    .from("app_settings")
    .upsert({ user_id: OWNER_ID }, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  return created ?? fallback;
}
