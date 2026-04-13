import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Check, Zap, Shield } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "upgrade" });
  return { title: `${t("title", { fallback: "Upgrade" })} – LadeKompass` };
}

export default async function UpgradePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "upgrade" });

  const plans = [
    {
      key: "free",
      name: "Free",
      price: "0 €",
      period: t("per_month", { fallback: "/ Monat" }),
      highlight: false,
      features: [
        t("feat_map", { fallback: "Kartenansicht mit allen Stationen" }),
        t("feat_routes_free", { fallback: "5 Routen / Monat" }),
        t("feat_community", { fallback: "Community-Meldungen lesen" }),
      ],
      cta: t("cta_current", { fallback: "Aktueller Plan" }),
      href: null,
    },
    {
      key: "lite",
      name: "Lite",
      price: "4,99 €",
      period: t("per_month", { fallback: "/ Monat" }),
      highlight: false,
      features: [
        t("feat_map", { fallback: "Kartenansicht mit allen Stationen" }),
        t("feat_routes_lite", { fallback: "30 Routen / Monat" }),
        t("feat_tariffs", { fallback: "Tarifvergleich" }),
        t("feat_favorites", { fallback: "10 Favoriten" }),
        t("feat_dashboard", { fallback: "Dashboard-Zugang" }),
        t("feat_reports", { fallback: "Community-Meldungen einreichen" }),
      ],
      cta: t("cta_upgrade_lite", { fallback: "Auf Lite upgraden" }),
      href: "mailto:hallo@ladekompass.de?subject=Upgrade%20Lite",
    },
    {
      key: "pro",
      name: "Pro",
      price: "9,99 €",
      period: t("per_month", { fallback: "/ Monat" }),
      highlight: true,
      features: [
        t("feat_map", { fallback: "Kartenansicht mit allen Stationen" }),
        t("feat_routes_pro", { fallback: "Unbegrenzte Routen" }),
        t("feat_tariffs", { fallback: "Tarifvergleich" }),
        t("feat_favorites_pro", { fallback: "Unbegrenzte Favoriten" }),
        t("feat_newsfeed", { fallback: "Community-Feed" }),
        t("feat_notifications", { fallback: "Push-Benachrichtigungen" }),
        t("feat_priority", { fallback: "Prioritäts-Support" }),
      ],
      cta: t("cta_upgrade_pro", { fallback: "Auf Pro upgraden" }),
      href: "mailto:hallo@ladekompass.de?subject=Upgrade%20Pro",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-light-soft)] border border-[var(--primary-light)] text-[var(--primary)] text-xs font-semibold mb-4">
            <Zap size={12} />
            {t("badge", { fallback: "Pläne & Preise" })}
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-base)] mb-3">
            {t("heading", { fallback: "Das richtige Paket für dich" })}
          </h1>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            {t("subheading", {
              fallback:
                "Starte kostenlos und erweitere jederzeit — keine Bindung, monatlich kündbar.",
            })}
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? "border-[var(--primary)] bg-[var(--primary-light-soft)] shadow-lg"
                  : "border-[var(--border)] bg-[var(--bg-surface)]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {t("popular", { fallback: "Beliebt" })}
                </div>
              )}
              <div className="mb-5">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-[var(--text-base)]">
                    {plan.price}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] mb-1">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-base)]">
                    <Check
                      size={13}
                      className="text-[var(--primary)] shrink-0 mt-0.5"
                    />
                    {feat}
                  </li>
                ))}
              </ul>

              {plan.href ? (
                <Link
                  href={plan.href}
                  className={`w-full text-center rounded-xl font-semibold text-sm py-2.5 transition-colors ${
                    plan.highlight
                      ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
                      : "border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-base)]"
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <div className="w-full text-center rounded-xl font-semibold text-sm py-2.5 border border-[var(--border)] text-[var(--text-muted)] cursor-default">
                  {plan.cta}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Feature comparison note */}
        <div className="mt-10 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2 text-[var(--text-base)]">
            <Shield size={16} className="text-[var(--primary)]" />
            <span className="text-sm font-semibold">
              {t("footer_note_title", { fallback: "DSGVO-konform & Made in Germany" })}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {t("footer_note_desc", {
              fallback:
                "Keine versteckten Kosten. Keine Werbung. Deine Daten bleiben in EU-Rechenzentren.",
            })}
          </p>
        </div>
      </div>
    </main>
  );
}
