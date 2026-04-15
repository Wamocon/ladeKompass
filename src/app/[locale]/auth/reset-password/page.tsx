"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Mail, Loader, AlertCircle, ArrowLeft, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/${locale}/auth/callback?type=recovery`,
      },
    );
    if (resetError) {
      setError(resetError.message);
    } else {
      setInfo(t("reset_email_sent"));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--primary)] mb-3">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-[var(--text-base)]">
            {t("reset_title")}
          </h1>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}
          {info ? (
            <div className="bg-[var(--primary-light-soft)] border border-[var(--primary-light)] text-[var(--primary)] rounded-xl px-4 py-3 text-sm">
              {info}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  {t("email_label")}
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@beispiel.de"
                    className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader size={16} className="animate-spin" />}
                {t("reset_button")}
              </button>
            </form>
          )}

          <Link
            href={`/${locale}/auth/login`}
            className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors pt-2"
          >
            <ArrowLeft size={12} />
            {t("has_account")}
          </Link>
        </div>
      </div>
    </div>
  );
}
