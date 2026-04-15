"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Eye, EyeOff, Loader, AlertCircle, Check, Lock, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/dashboard`), 2000);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-page) px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-(--primary) mb-3">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-(--text-base)">Neues Passwort setzen</h1>
          <p className="text-sm text-(--text-muted) mt-1">Gib dein neues Passwort ein.</p>
        </div>

        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl p-6 shadow-sm space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {success ? (
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 rounded-xl px-4 py-4 text-sm">
              <Check size={18} className="shrink-0" />
              <div>
                <p className="font-semibold">Passwort erfolgreich geändert!</p>
                <p className="text-xs mt-0.5 opacity-75">Du wirst weitergeleitet…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5 block">
                  Neues Passwort
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Mindestens 8 Zeichen"
                    className="w-full pl-9 pr-10 py-2.5 bg-(--bg-elevated) border border-(--border) rounded-xl text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:border-(--primary) focus:ring-1 focus:ring-(--primary)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--primary)"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5 block">
                  Passwort bestätigen
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Passwort wiederholen"
                    className="w-full pl-9 pr-4 py-2.5 bg-(--bg-elevated) border border-(--border) rounded-xl text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:border-(--primary) focus:ring-1 focus:ring-(--primary)"
                  />
                </div>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[8, 12, 16].map((len) => (
                      <div
                        key={len}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          password.length >= len
                            ? len === 8
                              ? "bg-amber-400"
                              : len === 12
                                ? "bg-green-400"
                                : "bg-green-600"
                            : "bg-(--bg-elevated)"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-(--text-muted)">
                    {password.length < 8
                      ? "Zu kurz"
                      : password.length < 12
                        ? "Ausreichend"
                        : password.length < 16
                          ? "Gut"
                          : "Sehr sicher"}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-(--primary) text-white font-semibold text-sm hover:bg-(--primary-hover) disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader size={16} className="animate-spin" />}
                Passwort speichern
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
