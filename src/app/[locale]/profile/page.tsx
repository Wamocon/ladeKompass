import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { User, Settings, Shield, Car } from "lucide-react";
import Link from "next/link";
import { VehicleManager } from "@/components/profile/VehicleManager";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: `${t("title", { fallback: "Profil" })} \u2013 LadeKompass` };
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const serviceSupabase = createServiceClient();
  const [{ data: profile }, { count: vehicleCount }] = await Promise.all([
    serviceSupabase.from("profiles").select("display_name, plan, role, created_at").eq("id", user.id).maybeSingle(),
    serviceSupabase.from("vehicles").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("de-DE", { year: "numeric", month: "long" })
    : null;
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
  const planLabel = (profile?.plan ?? "free").toUpperCase();

  return (
    <main className="min-h-screen bg-(--bg-page) px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Profile header card */}
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-(--primary-light-soft,oklch(0.95 0.02 var(--hue))) border-2 border-(--primary) flex items-center justify-center shrink-0">
              <User size={28} className="text-(--primary)" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-(--text-base) truncate">
                {profile?.display_name ?? user.email?.split("@")[0] ?? t("anonymous", { fallback: "Anonym" })}
              </h1>
              <p className="text-sm text-(--text-muted) truncate">{user.email}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  planLabel === "PRO"
                    ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
                    : "bg-(--bg-elevated) border-(--border) text-(--text-muted)"
                }`}>
                  {planLabel}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-(--bg-elevated) border border-(--border) text-(--text-muted) font-medium capitalize">
                  {profile?.role ?? "driver"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-(--border)">
            <div className="text-center">
              <p className="text-2xl font-black text-(--primary)">{vehicleCount ?? 0}</p>
              <p className="text-[11px] text-(--text-muted) mt-0.5">Fahrzeuge</p>
            </div>
            <div className="text-center border-x border-(--border)">
              <p className="text-lg font-black text-(--text-base)">{planLabel}</p>
              <p className="text-[11px] text-(--text-muted) mt-0.5">Plan</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-(--text-base)">{memberSince ?? "\u2013"}</p>
              <p className="text-[11px] text-(--text-muted) mt-0.5">Mitglied seit</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/${locale}/settings`}
            className="bg-(--bg-surface) border border-(--border) rounded-2xl p-4 flex items-center gap-3 hover:border-(--primary) transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-(--bg-elevated) flex items-center justify-center group-hover:bg-(--primary-light-soft,oklch(0.95 0.02 var(--hue))) transition-colors shrink-0">
              <Settings size={16} className="text-(--text-muted) group-hover:text-(--primary)" />
            </div>
            <div>
              <p className="text-sm font-semibold text-(--text-base)">Einstellungen</p>
              <p className="text-xs text-(--text-muted)">Profil, Benachricht.</p>
            </div>
          </Link>

          {isAdmin && (
            <Link
              href={`/${locale}/admin`}
              className="bg-(--bg-surface) border border-(--border) rounded-2xl p-4 flex items-center gap-3 hover:border-amber-400 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-(--bg-elevated) flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors shrink-0">
                <Shield size={16} className="text-(--text-muted) group-hover:text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--text-base)">Admin-Panel</p>
                <p className="text-xs text-(--text-muted)">Nutzer & Abos</p>
              </div>
            </Link>
          )}
        </div>

        {/* Vehicles */}
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Car size={16} className="text-(--primary)" />
            <h2 className="text-sm font-bold text-(--text-base)">
              {t("vehicles_heading", { fallback: "Meine Fahrzeuge" })}
            </h2>
          </div>
          <VehicleManager />
        </div>

      </div>
    </main>
  );
}
