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
    title: `${t("datenschutz", { fallback: "Datenschutzerklärung" })} – LadeKompass`,
  };
}

export default async function DatenschutzPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <LegalPageShell
      title={t("datenschutz", { fallback: "Datenschutzerklärung" })}
      updatedAt="2025-01"
    >
      <section>
        <h2>1. Verantwortliche Stelle</h2>
        <p>
          WAMOCON GmbH, Mergenthalerallee 79–81, 65760 Eschborn, Deutschland<br />
          E-Mail:{" "}
          <a href="mailto:datenschutz@ladekompass.de" className="text-[var(--primary)] underline">
            datenschutz@ladekompass.de
          </a>
        </p>
      </section>

      <section>
        <h2>2. Erhobene Daten</h2>
        <p>
          Wir verarbeiten folgende personenbezogene Daten: E-Mail-Adresse,
          Fahrzeugdaten (optional), Standortdaten (nur im Browser, nicht gespeichert),
          Community-Meldungen, Abonnement-Informationen.
        </p>
      </section>

      <section>
        <h2>3. Zweck der Verarbeitung</h2>
        <p>
          Die Daten werden ausschließlich zur Erbringung des LadeKompass-Dienstes
          verwendet: Authentifizierung, Routenplanung, Community-Feed, Tarifvergleich.
        </p>
      </section>

      <section>
        <h2>4. Hosting &amp; Auftragsverarbeitung</h2>
        <p>
          Die App wird auf Vercel (EU-Region) gehostet. Die Datenbank wird von Supabase
          (EU-Region) bereitgestellt. Beide Anbieter sind zur DSGVO-Konformität
          verpflichtet.
        </p>
      </section>

      <section>
        <h2>5. Rechte der betroffenen Person</h2>
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung und Datenportabilität
          gemäß DSGVO Art. 15–20. Anfragen an:{" "}
          <a href="mailto:datenschutz@ladekompass.de" className="text-[var(--primary)] underline">
            datenschutz@ladekompass.de
          </a>
        </p>
      </section>

      <section>
        <h2>6. Cookies</h2>
        <p>
          Wir verwenden ausschließlich technisch notwendige Cookies (Session-Token).
          Es werden keine Tracking- oder Werbe-Cookies eingesetzt.
        </p>
      </section>
    </LegalPageShell>
  );
}
