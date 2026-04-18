"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Eye, EyeOff, Loader, AlertCircle, Mail, Lock, User, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LegalConsentFields } from "@/components/legal/LegalConsentFields";
import {
  type LegalConsentState,
  hasAcceptedAllLegalConsents,
  createLegalConsentMetadata,
} from "@/lib/legal/consent";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [legalConsent, setLegalConsent] = useState<LegalConsentState>({
    termsAccepted: false,
    privacyAccepted: false,
    dsgvoAccepted: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (isSignUp && !hasAcceptedAllLegalConsents(legalConsent)) {
      setError("Bitte akzeptiere alle rechtlichen Bedingungen.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name || email.split("@")[0],
              ...createLegalConsentMetadata(legalConsent),
            },
          },
        });
        if (signUpError) throw signUpError;
        setInfo(t("confirm_email_sent"));
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        // Hard redirect so the browser sends fresh session cookies to the server
        window.location.href = `/${locale}/dashboard`;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setError(
        message.includes("Invalid login") ? t("login_error") : t("register_error"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--primary)] mb-3">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-base)]">
            Lade<span className="text-[var(--primary)]">Kompass</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {isSignUp ? t("register_title") : t("login_title")}
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          {/* Error / Info */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}
          {info && (
            <div className="bg-[var(--primary-light-soft)] border border-[var(--primary-light)] text-[var(--primary)] rounded-xl px-4 py-3 text-sm mb-4">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  {t("name_label")}
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>
            )}

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
                  autoComplete="email"
                  placeholder="name@beispiel.de"
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                {t("password_label")}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-base)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <LegalConsentFields
                value={legalConsent}
                onChange={setLegalConsent}
                disabled={loading}
              />
            )}

            {!isSignUp && (
              <div className="text-right">
                <Link
                  href={`/${locale}/auth/reset-password`}
                  className="text-xs text-[var(--primary)] hover:underline font-medium"
                >
                  {t("forgot_password")}
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:bg-[var(--primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {isSignUp ? t("register_button") : t("login_button")}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--bg-surface)] px-3 text-[var(--text-muted)] font-medium">
                {t("or_divider")}
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-sm font-medium text-[var(--text-base)] hover:bg-[var(--bg-elevated)] hover:border-[var(--primary)] transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t("google_button")}
          </button>

          <p className="text-center text-xs text-[var(--text-muted)] mt-5">
            {isSignUp ? t("has_account") : t("no_account")}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setInfo(""); }}
              className="text-[var(--primary)] font-bold hover:underline"
            >
              {isSignUp ? t("login_button") : t("register_button")}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-4">
          <Link
            href={`/${locale}/map`}
            className="hover:text-[var(--primary)] transition-colors"
          >
            {t("guest_mode")}
          </Link>
        </p>
      </div>
    </div>
  );
}
