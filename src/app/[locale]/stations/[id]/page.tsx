import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Station ${id} – LadeKompass` };
}

export default async function StationPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "station" });

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-[var(--text-base)] mb-2">
          {t("detail_heading", { fallback: "Stationsdetails" })}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          ID: <code className="font-mono text-xs">{id}</code>
        </p>
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 text-sm text-[var(--text-muted)]">
          {t("full_page_hint", {
            fallback:
              "Diese Seite zeigt vollständige Stationsdetails. Öffne eine Station auf der Karte für die interaktive Ansicht.",
          })}
        </div>
      </div>
    </main>
  );
}
