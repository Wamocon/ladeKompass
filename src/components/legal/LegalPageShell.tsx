"use client";

import React from "react";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface LegalPageShellProps {
  title: string;
  updatedAt: string;
  description?: string;
  children: React.ReactNode;
}

export function LegalPageShell({
  title,
  updatedAt,
  description,
  children,
}: LegalPageShellProps) {
  const t = useTranslations("legal");

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-base)] pb-20">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-[var(--bg-page)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/map"
            className="flex items-center gap-2 group text-[var(--text-muted)] hover:text-[var(--primary)] transition-all"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-sm font-semibold">{t("back")}</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full border border-[var(--border)]">
            <Clock size={12} className="text-[var(--primary)]" />
            {t("last_updated", { date: updatedAt })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 pt-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
              <ShieldCheck size={24} />
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-[var(--primary)] to-transparent opacity-20" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight underline decoration-[var(--primary)] decoration-4 underline-offset-8">
            {title}
          </h1>
          <p className="mt-6 text-lg text-[var(--text-muted)] leading-relaxed max-w-2xl">
            {description ?? t("legal_description")}
          </p>
        </div>

        <div className="space-y-6">{children}</div>

        <footer className="mt-20 pt-10 border-t border-[var(--border)] flex flex-col items-center gap-4 text-center">
          <span className="text-sm font-medium text-[var(--text-muted)] opacity-80">
            &copy; {new Date().getFullYear()} WAMOCON GmbH. Alle Rechte
            vorbehalten.
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-40 font-bold">
            LadeKompass – Alle Ladesäulen. Ein Überblick.
          </span>
        </footer>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-[var(--text-base)]">
        <span className="w-1.5 h-6 bg-[var(--primary)] rounded-full" />
        {title}
      </h2>
      <div className="space-y-4 text-[var(--text-muted)] leading-relaxed text-sm sm:text-base">
        {children}
      </div>
    </section>
  );
}
