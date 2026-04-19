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
  // Extended fields (require migration 20260415000001)
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

/** Columns that exist before migration 20260415000001 */
const BASE_VEHICLE_KEYS = new Set([
  "id", "user_id", "name", "brand", "model",
  "battery_kwh", "max_charge_kw", "ac_charge_kw", "connector_type", "is_default",
]);

function isSchemaError(msg: string) {
  return msg.includes("column") || msg.includes("schema cache") || msg.includes("does not exist");
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

export async function upsertVehicle(input: VehicleUpsertInput): Promise<{ error?: string; warning?: string }> {
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
  // Strip undefined, null, empty strings, and NaN
  const payload = Object.fromEntries(
    Object.entries(rawPayload).filter(([, v]) =>
      v !== undefined && v !== null && v !== "" && !(typeof v === "number" && isNaN(v)),
    ),
  );
  // Always include required fields
  payload.name = input.name;
  payload.battery_kwh = input.battery_kwh;
  payload.is_default = input.is_default ?? false;
  payload.user_id = user.id;

  async function runSave(p: Record<string, unknown>) {
    if (input.id) {
      return serviceSupabase.from("vehicles").update(p).eq("id", input.id!).eq("user_id", user!.id);
    }
    return serviceSupabase.from("vehicles").insert(p);
  }

  const { error } = await runSave(payload);

  // Graceful fallback: if extended columns don't exist yet (migration not run),
  // retry with only base columns so the vehicle is saved without extended fields.
  if (error && isSchemaError(error.message)) {
    const basePayload = Object.fromEntries(
      Object.entries(payload).filter(([k]) => BASE_VEHICLE_KEYS.has(k)),
    );
    const { error: fallbackError } = await runSave(basePayload);
    if (fallbackError) return { error: fallbackError.message };
    revalidatePath("/[locale]/profile", "page");
    return {
      warning:
        "Fahrzeug gespeichert. Erweiterte Felder (Farbe, Kennzeichen, etc.) werden erst nach der Datenbankaktualisierung gespeichert.",
    };
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

