import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

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

        <AdminUsersTable
          users={allProfiles}
          emailMap={emailMap}
          currentUserRole={role}
          currentUserId={user.id}
        />

        <p className="mt-3 text-xs text-(--text-muted) text-center">
          Schema: <code className="font-mono">{process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev"}</code>
        </p>
      </div>
    </main>
  );
}
