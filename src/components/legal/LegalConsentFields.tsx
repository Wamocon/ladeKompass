"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import type { LegalConsentState } from "@/lib/legal/consent";

interface LegalConsentFieldsProps {
  value: LegalConsentState;
  onChange: (next: LegalConsentState) => void;
  disabled?: boolean;
}

export function LegalConsentFields({
  value,
  onChange,
  disabled = false,
}: LegalConsentFieldsProps) {
  const t = useTranslations("legal");
  const pathname = usePathname();
  const localePrefix = pathname.match(/^\/(de|en)/)?.[0] ?? "/de";

  function update<K extends keyof LegalConsentState>(
    key: K,
    checked: boolean,
  ) {
    onChange({ ...value, [key]: checked });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 text-sm shadow-sm">
      <p className="mb-4 font-bold text-[var(--text-base)] flex items-center gap-2">
        <span className="w-1.5 h-4 bg-[var(--primary)] rounded-full" />
        {t("consent_intro")}
      </p>
      <div className="space-y-4 text-[var(--text-muted)]">
        {/* Terms */}
        <label className="group flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value.termsAccepted}
            onChange={(e) => update("termsAccepted", e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-5 w-5 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
          />
          <span className="leading-tight group-hover:text-[var(--text-base)] transition-colors">
            {t("consent_terms")}{" "}
            <Link
              href={`${localePrefix}/legal/agb`}
              className="font-bold text-[var(--primary)] hover:underline decoration-2 underline-offset-4"
              target="_blank"
            >
              {t("consent_terms_link")}
            </Link>
            .
          </span>
        </label>

        {/* Privacy */}
        <label className="group flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value.privacyAccepted}
            onChange={(e) => update("privacyAccepted", e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-5 w-5 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
          />
          <span className="leading-tight group-hover:text-[var(--text-base)] transition-colors">
            {t("consent_privacy")}{" "}
            <Link
              href={`${localePrefix}/legal/datenschutz`}
              className="font-bold text-[var(--primary)] hover:underline decoration-2 underline-offset-4"
              target="_blank"
            >
              {t("consent_privacy_link")}
            </Link>
            .
          </span>
        </label>

        {/* DSGVO */}
        <label className="group flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value.dsgvoAccepted}
            onChange={(e) => update("dsgvoAccepted", e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-5 w-5 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
          />
          <span className="leading-tight group-hover:text-[var(--text-base)] transition-colors">
            {t("consent_dsgvo")}
          </span>
        </label>
      </div>
    </div>
  );
}
