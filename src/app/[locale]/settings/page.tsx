import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: `${t("title", { fallback: "Einstellungen" })} – LadeKompass` };
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-[var(--text-base)]">
          {t("title", { fallback: "Einstellungen" })}
        </h1>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)]">
          {/* Language and theme are in the header — link there */}
          <div className="px-5 py-4">
            <p className="text-sm font-semibold text-[var(--text-base)]">
              {t("appearance_title", { fallback: "Erscheinungsbild" })}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {t("appearance_desc", {
                fallback:
                  "Sprache und Theme können im Header-Menü umgeschaltet werden.",
              })}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-sm font-semibold text-[var(--text-base)]">
              {t("notifications_title", { fallback: "Push-Benachrichtigungen" })}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {t("notifications_desc", {
                fallback:
                  "Erhalte Echtzeit-Meldungen für deine gespeicherten Ladestationen.",
              })}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-sm font-semibold text-[var(--text-base)]">
              {t("data_title", { fallback: "Meine Daten" })}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {t("data_desc", {
                fallback:
                  "Kontakt: datenschutz@ladekompass.de — Löschung auf Anfrage gemäß DSGVO.",
              })}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
