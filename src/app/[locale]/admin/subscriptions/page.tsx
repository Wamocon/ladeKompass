import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AdminSubscriptionsTable, type SubProfile } from "@/components/admin/AdminSubscriptionsTable";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return {
    title: `${t("subscriptions_title", { fallback: "Abonnements" })} – LadeKompass`,
  };
}

export default async function AdminSubscriptionsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  // Auth + role check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const svc = createServiceClient();
  const { data: myProfile } = await svc
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (myProfile?.role !== "super_admin") redirect(`/${locale}/admin`);

  // Fetch all profiles with subscription fields (added by migration 20260419000002).
  // Graceful fallback if migration hasn't been run yet.
  const { data: profiles, error } = await svc
    .from("profiles")
    .select(
      "id, display_name, plan, role, created_at, plan_started_at, plan_expires_at, is_trial, trial_ends_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  let allProfiles: SubProfile[];
  if (error && (error.message.includes("column") || error.message.includes("does not exist"))) {
    const { data: fallback } = await svc
      .from("profiles")
      .select("id, display_name, plan, role, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    allProfiles = ((fallback ?? []) as SubProfile[]).map((p) => ({
      ...p,
      plan_started_at: null,
      plan_expires_at: null,
      is_trial: null,
      trial_ends_at: null,
    }));
  } else {
    allProfiles = (profiles ?? []) as SubProfile[];
  }

  // Sort: pro first, then lite, then free
  allProfiles.sort((a, b) => {
    const order: Record<string, number> = { pro: 0, lite: 1, free: 2 };
    return (order[a.plan ?? "free"] ?? 2) - (order[b.plan ?? "free"] ?? 2);
  });

  // Fetch emails from auth admin API
  let emailMap: Record<string, string> = {};
  try {
    const { data: { users: authUsers } } = await svc.auth.admin.listUsers({ perPage: 200 });
    emailMap = Object.fromEntries((authUsers ?? []).map((u) => [u.id, u.email ?? ""]));
  } catch { /* service role might not have admin API access in all envs */ }

  const planCount = {
    pro:   allProfiles.filter((p) => p.plan === "pro").length,
    lite:  allProfiles.filter((p) => p.plan === "lite").length,
    free:  allProfiles.filter((p) => (p.plan ?? "free") === "free").length,
    trial: allProfiles.filter((p) => p.is_trial).length,
  };

  const migrationNeeded =
    error && (error.message.includes("column") || error.message.includes("does not exist"));

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/${locale}/admin`}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <Shield size={20} className="text-[var(--primary)]" />
          <h1 className="text-xl font-bold text-[var(--text-base)]">
            {t("subscriptions_title", { fallback: "Abonnements" })}
          </h1>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-[var(--bg-elevated)] px-2.5 py-1 rounded-full font-medium text-[var(--text-muted)]">
              {allProfiles.length} Nutzer
            </span>
            <span className="text-xs bg-[var(--primary)] text-white px-2.5 py-1 rounded-full font-bold">
              {planCount.pro} PRO
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">
              {planCount.lite} Lite
            </span>
            {planCount.trial > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full font-semibold">
                {planCount.trial} Trial
              </span>
            )}
          </div>
        </div>

        {/* Migration hint */}
        {migrationNeeded && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300">
            <strong>Migration ausstehend:</strong> Trial/Ablaufdatum-Felder fehlen noch.
            Führe{" "}
            <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
              supabase/migrations/20260419000002_subscription-management.sql
            </code>{" "}
            im Supabase Dashboard SQL-Editor aus. Plan-Änderungen funktionieren bereits.
          </div>
        )}

        <AdminSubscriptionsTable
          users={allProfiles}
          emailMap={emailMap}
          currentUserId={user.id}
        />

        <p className="text-xs text-[var(--text-muted)] text-center">
          Schema: <code className="font-mono">{process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev"}</code>
        </p>
      </div>
    </main>
  );
}

