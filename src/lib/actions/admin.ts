"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" as const };

  const svc = createServiceClient();
  const { data: myProfile } = await svc
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (myProfile?.role ?? "driver") as string;
  return { user, role, svc };
}

export async function updateUserPlan(
  userId: string,
  plan: "free" | "lite" | "pro",
  options?: {
    isTrial?: boolean;
    trialDays?: number;
    expiresAt?: string | null;
  },
): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: ctx.error };
  const { role, svc } = ctx;

  if (role !== "super_admin" && role !== "admin") {
    return { error: "Keine Berechtigung" };
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    plan,
    plan_started_at: now,
    is_trial: options?.isTrial ?? false,
    updated_at: now,
  };

  if (options?.isTrial && options.trialDays) {
    const trialEnd = new Date(
      Date.now() + options.trialDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    updates.trial_ends_at = trialEnd;
    updates.plan_expires_at = trialEnd;
  } else {
    updates.trial_ends_at = null;
    updates.plan_expires_at = options?.expiresAt ?? null;
  }

  const { error } = await svc.from("profiles").update(updates).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/[locale]/admin/users", "page");
  revalidatePath("/[locale]/admin/subscriptions", "page");
  return {};
}

export async function updateUserRole(
  userId: string,
  role: "driver" | "admin" | "super_admin",
): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: ctx.error };

  if (ctx.role !== "super_admin") {
    return { error: "Nur Super-Admin kann Rollen ändern" };
  }

  const { error } = await ctx.svc
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/[locale]/admin/users", "page");
  return {};
}

export async function updateUserDisplayName(
  userId: string,
  display_name: string,
): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: ctx.error };
  const { role, svc } = ctx;

  if (role !== "super_admin" && role !== "admin") {
    return { error: "Keine Berechtigung" };
  }

  const trimmed = display_name.trim();
  if (!trimmed || trimmed.length < 2) return { error: "Name zu kurz (mind. 2 Zeichen)" };
  if (trimmed.length > 60) return { error: "Name zu lang (max. 60 Zeichen)" };

  const { error } = await svc
    .from("profiles")
    .update({ display_name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/[locale]/admin/users", "page");
  return {};
}
