"use client";

import { useState, useEffect, startTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const COOKIE_KEY = "ladekompass_cookie_consent";

export function CookieBanner() {
  const t = useTranslations("cookie");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) startTransition(() => setVisible(true));
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl p-4 flex gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
          <Cookie size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text-base)] mb-1">
            {t("title")}
          </p>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {t("description")}{" "}
            <Link
              href={`/${locale}/legal/datenschutz`}
              className="text-[var(--primary)] hover:underline font-medium"
            >
              {t("learn_more")}
            </Link>
          </p>
          <button
            onClick={accept}
            className="mt-3 w-full rounded-xl bg-[var(--primary)] text-white text-sm font-semibold py-2 hover:bg-[var(--primary-hover)] transition-colors"
          >
            {t("accept")}
          </button>
        </div>
        <button
          onClick={accept}
          className="shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors self-start"
          aria-label="Schließen"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
