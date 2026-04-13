import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: `${t("impressum", { fallback: "Impressum" })} – LadeKompass` };
}

export default async function ImpressumPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <LegalPageShell title={t("impressum", { fallback: "Impressum" })} updatedAt="2025-01">
      <section>
        <h2>WAMOCON GmbH</h2>
        <p>
          Mergenthalerallee 79–81<br />
          65760 Eschborn<br />
          Deutschland
        </p>
        <p>
          Telefon: +49 6196 5838311<br />
          E-Mail:{" "}
          <a href="mailto:info@wamocon.com" className="text-[var(--primary)] underline">
            info@wamocon.com
          </a>
          <br />
          Projektkontakt:{" "}
          <a href="mailto:hallo@ladekompass.de" className="text-[var(--primary)] underline">
            hallo@ladekompass.de
          </a>
        </p>
      </section>

      <section>
        <h2>Vertretungsberechtigter Geschäftsführer</h2>
        <p>Dipl.-Ing. Waleri Moretz</p>
      </section>

      <section>
        <h2>Registereintrag</h2>
        <p>
          Sitz der Gesellschaft: Eschborn<br />
          Handelsregister: Eschborn HRB 123666<br />
          Umsatzsteuer-ID: DE344930486
        </p>
      </section>

      <section>
        <h2>Angaben zum Angebot</h2>
        <p>
          LadeKompass ist eine webbasierte Software-as-a-Service-Plattform für
          die neutrale Aggregation und den Vergleich von E-Auto-Ladestationen in
          Deutschland. Das Angebot richtet sich an private Elektroautofahrer sowie
          gewerbliche Flottenbetreiber.
        </p>
      </section>
    </LegalPageShell>
  );
}
