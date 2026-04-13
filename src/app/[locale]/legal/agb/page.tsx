import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: `${t("agb", { fallback: "Allgemeine Geschäftsbedingungen" })} – LadeKompass`,
  };
}

export default async function AgbPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <LegalPageShell
      title={t("agb", { fallback: "Allgemeine Geschäftsbedingungen" })}
      updatedAt="2025-01"
    >
      <section>
        <h2>§ 1 Geltungsbereich</h2>
        <p>
          Diese AGB gelten für die Nutzung des Online-Dienstes LadeKompass,
          betrieben von der WAMOCON GmbH, für alle Nutzerkonten und Abonnements.
        </p>
      </section>

      <section>
        <h2>§ 2 Leistungsgegenstand</h2>
        <p>
          LadeKompass aggregiert öffentlich verfügbare Informationen über
          E-Auto-Ladestationen in Deutschland. Die Plattform bietet Tarifvergleiche,
          Routenplanung und Community-Funktionen. Es wird keine Garantie für die
          Richtigkeit, Vollständigkeit oder Aktualität der angezeigten Daten übernommen.
        </p>
      </section>

      <section>
        <h2>§ 3 Abonnements und Preise</h2>
        <p>
          LadeKompass bietet drei Tarifstufen: Free (kostenlos), Lite und Pro.
          Aktuelle Preise sind auf der Upgrade-Seite einsehbar. Abonnements können
          monatlich gekündigt werden.
        </p>
      </section>

      <section>
        <h2>§ 4 Nutzerpflichten</h2>
        <p>
          Nutzer sind verpflichtet, keine falschen Meldungen einzureichen, keine
          automatisierten Anfragen zu stellen und die Plattform nicht zu missbrauchen.
          Community-Meldungen müssen wahrheitsgemäß sein.
        </p>
      </section>

      <section>
        <h2>§ 5 Haftungsausschluss</h2>
        <p>
          WAMOCON GmbH haftet nicht für Schäden, die durch die Nutzung von
          Drittanbieter-Daten (Open Charge Map, Chargeprice) entstehen. Die
          Nutzung der Plattform erfolgt auf eigene Verantwortung.
        </p>
      </section>

      <section>
        <h2>§ 6 Anwendbares Recht</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Eschborn.
        </p>
      </section>
    </LegalPageShell>
  );
}
