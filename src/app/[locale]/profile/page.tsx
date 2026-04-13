import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { User } from "lucide-react";
import { VehicleManager } from "@/components/profile/VehicleManager";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: `${t("title", { fallback: "Profil" })} – LadeKompass` };
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) redirect(`/${locale}/auth/login`);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, plan, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--primary-light-soft)] border-2 border-[var(--primary)] flex items-center justify-center">
            <User size={24} className="text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-base)]">
              {profile?.display_name ?? user.email?.split("@")[0] ?? t("anonymous", { fallback: "Anonym" })}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] font-medium">
                {profile?.plan?.toUpperCase() ?? "FREE"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] font-medium">
                {profile?.role ?? "driver"}
              </span>
            </div>
          </div>
        </div>

        {/* Vehicles */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="text-sm font-bold text-[var(--text-base)] mb-4">
            {t("vehicles_heading", { fallback: "Meine Fahrzeuge" })}
          </h2>
          <VehicleManager />
        </div>
      </div>
    </main>
  );
}
