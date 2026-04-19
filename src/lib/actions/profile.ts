"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface ProfileUpdateInput {
  display_name?: string;
  phone?: string;
  bio?: string;
  home_address?: string;
  work_address?: string;
  notify_station_status?: boolean;
  notify_news?: boolean;
  notify_promotions?: boolean;
  preferred_connector?: string;
  min_charge_kw?: number;
  charge_stop_soc?: number;
  preferred_networks?: string[];
  locale_pref?: string;
  map_prefs?: Record<string, unknown>;
}

export async function updateProfile(input: ProfileUpdateInput): Promise<{ error?: string }> {
  // Auth check via anon client, write via service client (bypasses RLS grant issues on custom schema)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const serviceSupabase = createServiceClient();
  // Use upsert so a missing profile row is created instead of silently ignored.
  // NOTE: Do NOT include updated_at – it is not in the profiles migrations.
  const { error } = await serviceSupabase
    .from("profiles")
    .upsert({ id: user.id, ...input }, { onConflict: "id" });

  if (error) return { error: error.message };
  revalidatePath("/[locale]/profile", "page");
  revalidatePath("/[locale]/settings", "page");
  return {};
}

export async function changePassword(
  newPassword: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return {};
}

export async function exportMyData(): Promise<{ data?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const serviceSupabase = createServiceClient();
  const [{ data: profile }, { data: vehicles }] = await Promise.all([
    serviceSupabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    serviceSupabase.from("vehicles").select("*").eq("user_id", user.id),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email, created_at: user.created_at },
    profile,
    vehicles: vehicles ?? [],
  };

  return { data: JSON.stringify(exportData, null, 2) };
}
