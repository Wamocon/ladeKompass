import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Metadata } from "next";
import { NewsFeed } from "@/components/dashboard/NewsFeed";
import { NearbyFeed } from "@/components/dashboard/NearbyFeed";
import { PlanGate } from "@/components/ui/PlanGate";
import { DashboardExpandableCard } from "@/components/dashboard/DashboardExpandableCard";
import { MapPin, Car, Route } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: `${t("title", { fallback: "Dashboard" })} – LadeKompass` };
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const cookieStore = await cookies();
  // In development, always use Pro plan for easy testing
  const isDev = process.env.NODE_ENV === "development";
  let userPlan = isDev ? "pro" : "free";
  let userName: string | null = isDev ? "Dev User" : null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        db: { schema: process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev" },
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options);
              }
            } catch {
              // Server Component — token refresh silent
            }
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, plan")
          .eq("id", user.id)
          .maybeSingle();

        // Keep isDev default if DB returns nothing
        userPlan = (profile?.plan as typeof userPlan) ?? userPlan;
        userName = profile?.display_name ?? user.email?.split("@")[0] ?? null;
      }
    } catch {
      // Supabase not configured — silent fallback
    }
  }

  const quickLinks = [
    {
      href: `/${locale}/map`,
      icon: <MapPin size={18} className="text-[var(--primary)]" />,
      label: t("quick_map", { fallback: "Karte" }),
      desc: t("quick_map_desc", { fallback: "Ladestationen in der Nähe finden" }),
      navigateLabel: t("quick_map", { fallback: "Zur Karte" }),
      details: (
        <ul className="space-y-1 text-xs">
          <li>• Echtzeitkarte aller Ladesäulen in Deutschland</li>
          <li>• Filtere nach Ladeleistung (AC / DC / HPC)</li>
          <li>• Steckertyp-Filter (Type 2, CCS, CHAdeMO, Tesla)</li>
          <li>• Nur verfügbare / 24/7 geöffnete Stationen anzeigen</li>
          <li>• Exportiere Stationen als CSV</li>
        </ul>
      ),
    },
    {
      href: `/${locale}/route`,
      icon: <Route size={18} className="text-[var(--primary)]" />,
      label: t("quick_route", { fallback: "Routenplaner" }),
      desc: t("quick_route_desc", { fallback: "Langstrecke mit Ladestopps planen" }),
      navigateLabel: t("quick_route", { fallback: "Route planen" }),
      details: (
        <ul className="space-y-1 text-xs">
          <li>• Automatische Berechnung optimaler Ladestopps</li>
          <li>• Berücksichtigt Fahrzeugreichweite &amp; aktuellen Akkustand</li>
          <li>• Schritt-für-Schritt Navigation mit GPS</li>
          <li>• Spurempfehlung an Kreuzungen</li>
        </ul>
      ),
    },
    {
      href: `/${locale}/profile`,
      icon: <Car size={18} className="text-[var(--primary)]" />,
      label: t("quick_vehicles", { fallback: "Fahrzeuge" }),
      desc: t("quick_vehicles_desc", { fallback: "Fahrzeugprofile verwalten" }),
      navigateLabel: t("quick_vehicles", { fallback: "Zum Profil" }),
      details: (
        <ul className="space-y-1 text-xs">
          <li>• Fahrzeugprofile anlegen &amp; bearbeiten</li>
          <li>• Reichweite &amp; Batterie-Kapazität eintragen</li>
          <li>• Profil wird für die Routenplanung genutzt</li>
          <li>• Kontodaten &amp; Abo-Einstellungen verwalten</li>
        </ul>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-base)]">
            {userName
              ? t("welcome_name", { name: userName, fallback: `Hallo, ${userName}` })
              : t("welcome", { fallback: "Willkommen zurück" })}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t("subtitle", { fallback: "Dein LadeKompass-Dashboard" })}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {quickLinks.map((link) => (
            <DashboardExpandableCard
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              desc={link.desc}
              details={link.details}
              navigateLabel={link.navigateLabel}
            />
          ))}
        </div>

        {/* Nearby Feed — location-based stations (all plans) */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <NearbyFeed />
        </div>

        {/* Community News Feed */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
          <PlanGate feature="newsFeed" requiredPlan="lite" userPlan={userPlan as "free" | "lite" | "pro"}>
            <NewsFeed />
          </PlanGate>
        </div>
      </div>
    </main>
  );
}
