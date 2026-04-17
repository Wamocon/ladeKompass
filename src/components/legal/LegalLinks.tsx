"use client";

import Link from "next/link";
import { FileText, ReceiptText, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

const LEGAL_ITEMS = [
  { href: "/legal/impressum", labelKey: "impressum" as const, icon: FileText },
  { href: "/legal/datenschutz", labelKey: "datenschutz" as const, icon: Shield },
  { href: "/legal/agb", labelKey: "agb" as const, icon: ReceiptText },
] as const;

interface LegalLinksProps {
  className?: string;
  variant?: "inline" | "cards";
}

export function LegalLinks({ className, variant = "inline" }: LegalLinksProps) {
  const t = useTranslations("legal");
  const pathname = usePathname();

  // Determine locale prefix from current pathname
  const localePrefix = pathname.match(/^\/(de|en)/)?.[0] ?? "/de";

  if (variant === "cards") {
    return (
      <div className={`grid gap-4 sm:grid-cols-3 ${className ?? ""}`}>
        {LEGAL_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={`${localePrefix}${item.href}`}
            className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4 text-sm font-bold transition-all hover:bg-[var(--bg-elevated)] hover:border-[var(--primary)] hover:shadow-lg group"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--primary-light)] bg-[var(--primary-light-soft)] text-[var(--primary)] group-hover:scale-110 transition-transform">
              <item.icon size={20} />
            </span>
            <span className="text-[var(--text-base)]">{t(item.labelKey)}</span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-3 ${className ?? ""}`}
    >
      {LEGAL_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={`${localePrefix}${item.href}`}
          className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest flex items-center gap-2"
        >
          <item.icon size={12} />
          {t(item.labelKey)}
        </Link>
      ))}
    </div>
  );
}
