import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Shield } from "lucide-react";

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

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  monthly_routes_used: number;
  monthly_routes_limit: number | null;
  created_at: string;
  profiles: { display_name: string | null; email: string | null } | null;
}

export default async function AdminSubscriptionsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <main className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">
          Service role key not configured.
        </p>
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

  if (profile?.role !== "super_admin") redirect(`/${locale}/admin`);

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*, profiles(display_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  const subscriptions = (subs ?? []) as Subscription[];

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={20} className="text-[var(--primary)]" />
          <h1 className="text-xl font-bold text-[var(--text-base)]">
            {t("subscriptions_title", { fallback: "Abonnements" })}
          </h1>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                  <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {t("col_user", { fallback: "Nutzer" })}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {t("col_plan", { fallback: "Plan" })}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {t("col_routes", { fallback: "Routen/Monat" })}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {t("col_since", { fallback: "Seit" })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {subscriptions.map((sub) => {
                  const planColors: Record<string, string> = {
                    pro: "bg-[var(--primary)] text-white",
                    lite: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                    free: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                  };
                  return (
                    <tr key={sub.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-3 text-[var(--text-base)]">
                        <p className="font-medium">
                          {sub.profiles?.display_name ?? "—"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {sub.profiles?.email ?? sub.user_id}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            planColors[sub.plan] ?? planColors.free
                          }`}
                        >
                          {sub.plan?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {sub.monthly_routes_used} /{" "}
                        {sub.monthly_routes_limit ?? "∞"}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                        {new Date(sub.created_at).toLocaleDateString("de-DE")}
                      </td>
                    </tr>
                  );
                })}
                {subscriptions.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-[var(--text-muted)]"
                    >
                      {t("no_subscriptions", { fallback: "Keine Abonnements vorhanden." })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
