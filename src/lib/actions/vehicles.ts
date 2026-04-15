"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface Vehicle {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  model?: string;
  battery_kwh: number;
  max_charge_kw?: number;
  ac_charge_kw?: number;
  connector_type?: string;
  is_default: boolean;
  // Extended fields
  year?: number;
  color?: string;
  license_plate?: string;
  vin?: string;
  purchase_date?: string;
  mileage_km?: number;
  range_km?: number;
  image_url?: string;
  notes?: string;
  insurance_expiry?: string;
  tuev_expiry?: string;
  preferred_soc_min?: number;
  preferred_soc_max?: number;
  efficiency_kwh_per_100km?: number;
}

export interface VehicleUpsertInput {
  id?: string;
  name: string;
  brand?: string;
  model?: string;
  battery_kwh: number;
  max_charge_kw?: number;
  ac_charge_kw?: number;
  connector_type?: string;
  is_default?: boolean;
  year?: number;
  color?: string;
  license_plate?: string;
  vin?: string;
  purchase_date?: string;
  mileage_km?: number;
  range_km?: number;
  notes?: string;
  insurance_expiry?: string;
  tuev_expiry?: string;
  preferred_soc_min?: number;
  preferred_soc_max?: number;
  efficiency_kwh_per_100km?: number;
}

export async function listVehicles(): Promise<Vehicle[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const serviceSupabase = createServiceClient();
  const { data } = await serviceSupabase
    .from("vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (data as Vehicle[]) ?? [];
}

export async function upsertVehicle(input: VehicleUpsertInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const serviceSupabase = createServiceClient();
  if (input.is_default) {
    await serviceSupabase
      .from("vehicles")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const rawPayload = { ...input, user_id: user.id };
  const payload = Object.fromEntries(
    Object.entries(rawPayload).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  payload.name = input.name;
  payload.battery_kwh = input.battery_kwh;
  payload.is_default = input.is_default ?? false;
  payload.user_id = user.id;

  let error;
  if (input.id) {
    ({ error } = await serviceSupabase
      .from("vehicles")
      .update(payload)
      .eq("id", input.id)
      .eq("user_id", user.id));
  } else {
    ({ error } = await serviceSupabase.from("vehicles").insert(payload));
  }

  if (error) return { error: error.message };

  revalidatePath("/[locale]/profile", "page");
  return {};
}

export async function deleteVehicle(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const serviceSupabase = createServiceClient();
  const { error } = await serviceSupabase
    .from("vehicles")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/[locale]/profile", "page");
  return {};
}
