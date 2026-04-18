import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Users, ArrowLeft, Shield, Crown, User } from "lucide-react";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: `${t("users_link", { fallback: "Nutzer verwalten" })} – LadeKompass` };
}

interface Profile {
  id: string;
  display_name: string | null;
  plan: string | null;
  role: string | null;
  created_at: string;
}

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  // Auth guard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const serviceSupabase = createServiceClient();
  const { data: myProfile } = await serviceSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = myProfile?.role ?? "driver";
  if (role !== "admin" && role !== "super_admin") {
    redirect(`/${locale}/admin`);
  }

  // Fetch all profiles
  const { data: profiles } = await serviceSupabase
    .from("profiles")
    .select("id, display_name, plan, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  // Fetch emails from auth.users via admin API
  let emailMap: Record<string, string> = {};
  try {
    const { data: { users: authUsers } } = await serviceSupabase.auth.admin.listUsers({ perPage: 200 });
    emailMap = Object.fromEntries((authUsers ?? []).map((u) => [u.id, u.email ?? ""]));
  } catch {
    // service role might not have admin access in all envs — gracefully skip
  }

  const allProfiles = (profiles ?? []) as Profile[];

  const planColors: Record<string, string> = {
    pro:  "bg-[var(--primary)] text-white",
    lite: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    free: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };

  const roleIcon = (r: string | null) => {
    if (r === "super_admin") return <Crown size={12} className="text-yellow-500" />;
    if (r === "admin") return <Shield size={12} className="text-(--primary)" />;
    return <User size={12} className="text-(--text-muted)" />;
  };

  return (
    <main className="min-h-screen bg-(--bg-page) px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/${locale}/admin`}
            className="p-1.5 rounded-lg hover:bg-(--bg-elevated) text-(--text-muted) transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <Users size={20} className="text-(--primary)" />
          <h1 className="text-xl font-bold text-(--text-base)">
            {t("users_link", { fallback: "Nutzer verwalten" })}
          </h1>
          <span className="ml-auto text-xs text-(--text-muted) bg-(--bg-elevated) px-2.5 py-1 rounded-full font-medium">
            {allProfiles.length} {t("total_users", { fallback: "Nutzer gesamt" })}
          </span>
        </div>

        {/* Table */}
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--border) bg-(--bg-elevated)">
                  <th className="text-left px-4 py-3 text-xs font-bold text-(--text-muted) uppercase tracking-wider">
                    {t("col_user", { fallback: "Nutzer" })}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-(--text-muted) uppercase tracking-wider">
                    {t("col_plan", { fallback: "Plan" })}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-(--text-muted) uppercase tracking-wider">
                    Rolle
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-(--text-muted) uppercase tracking-wider">
                    {t("col_since", { fallback: "Seit" })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {allProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-(--bg-elevated) transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-(--text-base)">
                        {p.display_name ?? "—"}
                      </p>
                      <p className="text-xs text-(--text-muted) font-mono">
                        {emailMap[p.id] ?? p.id.slice(0, 8) + "…"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${planColors[p.plan ?? "free"] ?? planColors.free}`}>
                        {(p.plan ?? "free").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-(--text-muted)">
                        {roleIcon(p.role)}
                        <span className="text-xs capitalize">{p.role ?? "driver"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-(--text-muted)">
                      {new Date(p.created_at).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                ))}
                {allProfiles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-(--text-muted)">
                      {t("no_users", { fallback: "Keine Nutzer gefunden." })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-xs text-(--text-muted) text-center">
          Schema: <code className="font-mono">{process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev"}</code>
        </p>
      </div>
    </main>
  );
}
