import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "de" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  // Try to get authenticated user (graceful if Supabase not yet configured)
  let userPlan: "free" | "lite" | "pro" | undefined;
  let userRole: "driver" | "fleet_manager" | "admin" | "super_admin" | undefined;
  let userName: string | undefined;
  let isAuthenticated = false;

  // In development, fall back to Pro/super_admin if no real user is found
  const isDev = process.env.NODE_ENV === "development";

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      isAuthenticated = true;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, role, plan")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        userPlan = profile.plan as typeof userPlan;
        userRole = profile.role as typeof userRole;
        userName = profile.display_name ?? user.email?.split("@")[0];
      }
    } else if (isDev) {
      // No real user in dev → simulate pro/super_admin for easy UI testing
      isAuthenticated = true;
      userPlan = "pro";
      userRole = "super_admin";
      userName = "Dev User";
    }
  } catch {
    // Supabase not yet configured – ok in development
    if (isDev) {
      isAuthenticated = true;
      userPlan = "pro";
      userRole = "super_admin";
      userName = "Dev User";
    }
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex flex-col min-h-screen">
        <Header
          userPlan={userPlan}
          userRole={userRole}
          userName={userName}
          isAuthenticated={isAuthenticated}
        />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
      </div>
    </NextIntlClientProvider>
  );
}
