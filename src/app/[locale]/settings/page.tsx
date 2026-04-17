import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: `${t("title", { fallback: "Einstellungen" })} \u2013 LadeKompass` };
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("display_name, phone, bio, home_address, work_address, notify_station_status, notify_news, notify_promotions, preferred_connector, min_charge_kw, charge_stop_soc")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-(--bg-page) px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-(--primary)" />
          <h1 className="text-xl font-bold text-(--text-base)">
            {t("title", { fallback: "Einstellungen" })}
          </h1>
        </div>

        <SettingsForm initialProfile={profile ?? {}} userEmail={user.email ?? ""} />
      </div>
    </main>
  );
}
