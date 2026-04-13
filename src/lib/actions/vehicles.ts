"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";

export interface Vehicle {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  model?: string;
  battery_kwh: number;
  max_charge_kw?: number;
  connector_type?: string;
  is_default: boolean;
}

export interface VehicleUpsertInput {
  id?: string;
  name: string;
  brand?: string;
  model?: string;
  battery_kwh: number;
  max_charge_kw?: number;
  connector_type?: string;
  is_default?: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

export async function listVehicles(): Promise<Vehicle[]> {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (data as Vehicle[]) ?? [];
}

export async function upsertVehicle(input: VehicleUpsertInput): Promise<{ error?: string }> {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  if (input.is_default) {
    await supabase
      .from("vehicles")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const payload = { ...input, user_id: user.id };

  let error;
  if (input.id) {
    ({ error } = await supabase
      .from("vehicles")
      .update(payload)
      .eq("id", input.id)
      .eq("user_id", user.id));
  } else {
    ({ error } = await supabase.from("vehicles").insert(payload));
  }

  if (error) return { error: error.message };

  revalidatePath("/[locale]/profile", "page");
  return {};
}

export async function deleteVehicle(id: string): Promise<{ error?: string }> {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/[locale]/profile", "page");
  return {};
}
