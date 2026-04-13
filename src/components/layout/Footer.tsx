import { LegalLinks } from "@/components/legal/LegalLinks";
import { DevelopedInGermanyBadge } from "@/components/legal/DevelopedInGermanyBadge";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="mt-auto py-10 px-6 border-t border-[var(--border)] bg-[var(--bg-base)]">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-black tracking-tight text-[var(--text-base)]">
            Lade<span className="text-[var(--primary)]">Kompass</span>
          </span>
          <span className="text-xs text-[var(--text-muted)] opacity-60">
            {t("tagline")}
          </span>
        </div>

        <LegalLinks
          variant="inline"
          className="opacity-80 hover:opacity-100 transition-opacity"
        />

        <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-40 font-bold">
          {t("copyright", { year: new Date().getFullYear() })}
        </span>

        <div className="scale-90 origin-center -mt-2">
          <DevelopedInGermanyBadge />
        </div>
      </div>
    </footer>
  );
}
