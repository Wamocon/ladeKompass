import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Users, Shield } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: `${t("title", { fallback: "Admin" })} – LadeKompass` };
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <main className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Supabase not configured.</p>
      </main>
    );
  }

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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "driver";
  if (role !== "admin" && role !== "super_admin") {
    redirect(`/${locale}/dashboard`);
  }

  // Stats
  const [{ count: userCount }, { count: reportCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("station_reports").select("*", { count: "exact", head: true }),
  ]);

  const adminLinks = [
    {
      href: `/${locale}/admin/subscriptions`,
      icon: <Shield size={18} className="text-[var(--primary)]" />,
      label: t("subscriptions_link", { fallback: "Abonnements verwalten" }),
      available: role === "super_admin",
    },
    {
      href: `/${locale}/admin/users`,
      icon: <Users size={18} className="text-[var(--primary)]" />,
      label: t("users_link", { fallback: "Nutzer verwalten" }),
      available: true,
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield size={22} className="text-[var(--primary)]" />
          <h1 className="text-xl font-bold text-[var(--text-base)]">
            {t("title", { fallback: "Admin-Panel" })}
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)] text-white font-bold uppercase">
            {role}
          </span>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-xs text-[var(--text-muted)] mb-1">
              {t("total_users", { fallback: "Nutzer gesamt" })}
            </p>
            <p className="text-2xl font-bold text-[var(--text-base)]">
              {userCount ?? "—"}
            </p>
          </div>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-xs text-[var(--text-muted)] mb-1">
              {t("total_reports", { fallback: "Community-Berichte" })}
            </p>
            <p className="text-2xl font-bold text-[var(--text-base)]">
              {reportCount ?? "—"}
            </p>
          </div>
        </div>

        {/* Action links */}
        <div className="space-y-3">
          {adminLinks
            .filter((l) => l.available)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 hover:border-[var(--primary)] hover:bg-[var(--primary-light-soft)] transition-colors"
              >
                {link.icon}
                <span className="text-sm font-semibold text-[var(--text-base)]">
                  {link.label}
                </span>
              </Link>
            ))}
        </div>
      </div>
    </main>
  );
}
