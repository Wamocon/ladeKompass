import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { PlanGate } from "@/components/ui/PlanGate";
import { RoutePlannerClient } from "@/components/route/RoutePlannerClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "route" });
  return { title: `${t("title", { fallback: "Routenplaner" })} – LadeKompass` };
}

export default async function RoutePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "route" });

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-bold text-[var(--text-base)] mb-1">
          {t("title", { fallback: "Routenplaner" })}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {t("subtitle", {
            fallback:
              "Plane deine Langstrecke mit automatischen Ladestopps — basierend auf deinem Akku.",
          })}
        </p>
        <PlanGate feature="maxRoutesPerMonth" requiredPlan="lite" userPlan="free">
          <RoutePlannerClient />
        </PlanGate>
      </div>
    </main>
  );
}
