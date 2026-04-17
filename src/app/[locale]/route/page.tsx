import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { PlanGate } from "@/components/ui/PlanGate";
import { RoutePlannerClient } from "@/components/route/RoutePlannerClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "route" });
  return { title: `${t("title", { fallback: "Routenplaner" })} \u2013 LadeKompass` };
}

export default async function RoutePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "route" });

  // Read user plan from DB
  const isDev = process.env.NODE_ENV === "development";
  let userPlan: "free" | "lite" | "pro" = isDev ? "pro" : "free";

  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        db: { schema: process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev" },
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs) => {
            try { for (const { name, value, options } of cs) cookieStore.set(name, value, options); }
            catch { /* server component */ }
          },
        },
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .maybeSingle();
        userPlan = (profile?.plan as typeof userPlan) ?? userPlan;
      }
    }
  } catch { /* silent */ }

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-bold text-[var(--text-base)] mb-1">
          {t("title", { fallback: "Routenplaner" })}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {t("subtitle", {
            fallback:
              "Plane deine Langstrecke mit automatischen Ladestopps \u2014 basierend auf deinem Akku.",
          })}
        </p>
        <PlanGate feature="maxRoutesPerMonth" requiredPlan="lite" userPlan={userPlan}>
          <RoutePlannerClient />
        </PlanGate>
      </div>
    </main>
  );
}
