"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown, Check, Loader2, Clock, Calendar, X, Gift, Ban,
} from "lucide-react";
import { updateUserPlan } from "@/lib/actions/admin";

export interface SubProfile {
  id: string;
  display_name: string | null;
  plan: string | null;
  role: string | null;
  created_at: string;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  is_trial: boolean | null;
  trial_ends_at: string | null;
}

interface Props {
  users: SubProfile[];
  emailMap: Record<string, string>;
  currentUserId: string;
}

const PLAN_OPTIONS = [
  { value: "free", label: "Free", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  { value: "lite", label: "Lite", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "pro",  label: "PRO",  cls: "bg-[var(--primary)] text-white" },
] as const;

const TRIAL_OPTIONS = [
  { days: 7,  label: "7 Tage" },
  { days: 14, label: "14 Tage" },
  { days: 30, label: "30 Tage" },
];

function isExpiringSoon(plan_expires_at: string | null): boolean {
  const now = Date.now();
  if (!plan_expires_at) return false;
  const exp = new Date(plan_expires_at).getTime();
  return exp - now < 7 * 86400000 && exp > now;
}

type FilterKey = "all" | "pro" | "lite" | "free" | "trial";

function planStatus(u: SubProfile): "expired" | "trial" | "active" | "free" {
  if ((u.plan ?? "free") === "free") return "free";
  const now = Date.now();
  if (u.is_trial) {
    if (u.trial_ends_at && new Date(u.trial_ends_at).getTime() < now) return "expired";
    return "trial";
  }
  if (u.plan_expires_at && new Date(u.plan_expires_at).getTime() < now) return "expired";
  return "active";
}

function StatusBadge({ u }: { u: SubProfile }) {
  const s = planStatus(u);
  const map = {
    active:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    trial:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    free:    "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  };
  const labels = { active: "Aktiv", trial: "Trial", expired: "Abgelaufen", free: "Free" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${map[s]}`}>
      {labels[s]}
    </span>
  );
}

export function AdminSubscriptionsTable({ users, emailMap, currentUserId }: Props) {
  const [localUsers, setLocalUsers] = useState(users);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [planPop, setPlanPop]   = useState<string | null>(null);
  const [trialPop, setTrialPop] = useState<string | null>(null);
  const [expiryEdit, setExpiryEdit] = useState<string | null>(null);
  const [expiryInput, setExpiryInput] = useState("");
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLocalUsers(users); }, [users]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPlanPop(null);
        setTrialPop(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  }

  function setPend(key: string, v: boolean) {
    setPending((p) =>
      v
        ? { ...p, [key]: true }
        : Object.fromEntries(Object.entries(p).filter(([k]) => k !== key)),
    );
  }

  async function handlePlanChange(uid: string, plan: string, opts?: { isTrial?: boolean; trialDays?: number; expiresAt?: string | null }) {
    setPlanPop(null);
    setTrialPop(null);
    setPend(uid + "_plan", true);
    const res = await updateUserPlan(uid, plan as "free" | "lite" | "pro", opts);
    setPend(uid + "_plan", false);
    if (res.error) return showToast(res.error, false);
    setLocalUsers((us) =>
      us.map((u) => {
        if (u.id !== uid) return u;
        const now = new Date().toISOString();
        const trialEnd = opts?.trialDays
          ? new Date(Date.now() + opts.trialDays * 86400000).toISOString()
          : null;
        return {
          ...u,
          plan,
          plan_started_at: now,
          is_trial: opts?.isTrial ?? false,
          trial_ends_at: opts?.isTrial ? trialEnd : null,
          plan_expires_at: opts?.expiresAt ?? (opts?.isTrial ? trialEnd : u.plan_expires_at),
        };
      }),
    );
    showToast(opts?.isTrial ? `Trial aktiviert (${opts.trialDays} Tage) ✓` : "Plan aktualisiert ✓");
  }

  async function handleExpirySave(uid: string) {
    setExpiryEdit(null);
    if (!expiryInput) return;
    const expiresAt = new Date(expiryInput).toISOString();
    const user = localUsers.find((u) => u.id === uid);
    if (!user?.plan || user.plan === "free") return;
    setPend(uid + "_expiry", true);
    const res = await updateUserPlan(uid, user.plan as "free" | "lite" | "pro", { expiresAt });
    setPend(uid + "_expiry", false);
    if (res.error) return showToast(res.error, false);
    setLocalUsers((us) =>
      us.map((u) => (u.id === uid ? { ...u, plan_expires_at: expiresAt } : u)),
    );
    showToast("Ablaufdatum gesetzt ✓");
  }

  async function handleRemovePlan(uid: string) {
    setPlanPop(null);
    setPend(uid + "_plan", true);
    const res = await updateUserPlan(uid, "free");
    setPend(uid + "_plan", false);
    if (res.error) return showToast(res.error, false);
    setLocalUsers((us) =>
      us.map((u) =>
        u.id === uid
          ? { ...u, plan: "free", is_trial: false, trial_ends_at: null, plan_expires_at: null }
          : u,
      ),
    );
    showToast("Plan entfernt ✓");
  }

  const filtered = localUsers.filter((u) => {
    if (filter === "all") return true;
    if (filter === "trial") return !!u.is_trial;
    return (u.plan ?? "free") === filter;
  });

  const counts: Record<FilterKey, number> = {
    all:   localUsers.length,
    pro:   localUsers.filter((u) => u.plan === "pro").length,
    lite:  localUsers.filter((u) => u.plan === "lite").length,
    free:  localUsers.filter((u) => (u.plan ?? "free") === "free").length,
    trial: localUsers.filter((u) => !!u.is_trial).length,
  };

  return (
    <div ref={containerRef} className="relative space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pro", "lite", "free", "trial"] as FilterKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === key
                ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]"
            }`}
          >
            {key === "all" ? "Alle" : key === "trial" ? "Trial" : key.toUpperCase()}
            {" "}
            <span className="opacity-70">({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Nutzer</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Aktiv seit / bis</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((u) => {
                const isSelf   = u.id === currentUserId;
                const planOpt  = PLAN_OPTIONS.find((o) => o.value === (u.plan ?? "free")) ?? PLAN_OPTIONS[0];
                const hasPlan  = (u.plan ?? "free") !== "free";
                const expDate  = u.plan_expires_at ? new Date(u.plan_expires_at) : null;
                const startDate = u.plan_started_at ? new Date(u.plan_started_at) : null;
                const isExpiring = isExpiringSoon(u.plan_expires_at);

                return (
                  <tr key={u.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                    {/* Nutzer */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-base)] truncate max-w-[200px]">
                        {u.display_name ?? "—"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[200px]">
                        {emailMap[u.id] ?? u.id.slice(0, 8) + "…"}
                      </p>
                    </td>

                    {/* Plan mit Popover */}
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <button
                          disabled={isSelf || !!pending[u.id + "_plan"]}
                          onClick={() => setPlanPop(planPop === u.id ? null : u.id)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold transition-opacity ${planOpt.cls} ${
                            isSelf ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"
                          }`}
                        >
                          {pending[u.id + "_plan"] ? <Loader2 size={10} className="animate-spin" /> : null}
                          {planOpt.label}
                          {!isSelf && <ChevronDown size={9} />}
                        </button>
                        {planPop === u.id && (
                          <div className="absolute z-30 top-full left-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl py-1 min-w-[130px]">
                            {PLAN_OPTIONS.filter((o) => o.value !== "free").map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handlePlanChange(u.id, opt.value)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-elevated)] text-left"
                              >
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${opt.cls}`}>
                                  {opt.label}
                                </span>
                                {(u.plan ?? "free") === opt.value && !u.is_trial && (
                                  <Check size={11} className="text-green-500 ml-auto" />
                                )}
                              </button>
                            ))}
                            {hasPlan && (
                              <>
                                <div className="my-1 border-t border-[var(--border)]" />
                                <button
                                  onClick={() => handleRemovePlan(u.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-xs text-red-600 dark:text-red-400"
                                >
                                  <Ban size={11} />
                                  Plan entfernen
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge u={u} />
                    </td>

                    {/* Aktiv seit / bis */}
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      <div className="space-y-0.5">
                        {startDate && (
                          <p>ab {startDate.toLocaleDateString("de-DE")}</p>
                        )}
                        {expiryEdit === u.id ? (
                          <form
                            onSubmit={(e) => { e.preventDefault(); handleExpirySave(u.id); }}
                            className="flex items-center gap-1 mt-1"
                          >
                            <input
                              autoFocus
                              type="date"
                              value={expiryInput}
                              onChange={(e) => setExpiryInput(e.target.value)}
                              onBlur={() => handleExpirySave(u.id)}
                              className="text-xs border border-[var(--border)] rounded-lg px-1.5 py-0.5 bg-[var(--bg-elevated)] text-[var(--text-base)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            />
                            <button type="submit" className="p-0.5 text-green-500"><Check size={12} /></button>
                            <button type="button" onClick={() => setExpiryEdit(null)} className="p-0.5 text-[var(--text-muted)]"><X size={12} /></button>
                          </form>
                        ) : expDate ? (
                          <button
                            disabled={isSelf || !!pending[u.id + "_expiry"]}
                            onClick={() => {
                              setExpiryEdit(u.id);
                              setExpiryInput(expDate.toISOString().split("T")[0]);
                            }}
                            className={`flex items-center gap-1 text-xs hover:text-[var(--primary)] transition-colors group/exp ${
                              isExpiring ? "text-amber-500 font-semibold" : ""
                            }`}
                            title="Ablaufdatum ändern"
                          >
                            <Calendar size={10} />
                            bis {expDate.toLocaleDateString("de-DE")}
                            {pending[u.id + "_expiry"] && <Loader2 size={10} className="animate-spin" />}
                          </button>
                        ) : hasPlan ? (
                          <button
                            disabled={isSelf}
                            onClick={() => { setExpiryEdit(u.id); setExpiryInput(""); }}
                            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                          >
                            <Calendar size={10} />
                            Ablauf setzen
                          </button>
                        ) : null}
                      </div>
                    </td>

                    {/* Aktionen */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Trial-Dropdown */}
                        {hasPlan && !isSelf && (
                          <div className="relative inline-block">
                            <button
                              disabled={!!pending[u.id + "_plan"]}
                              onClick={() => setTrialPop(trialPop === u.id ? null : u.id)}
                              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                u.is_trial
                                  ? "border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                              }`}
                            >
                              <Gift size={11} />
                              {u.is_trial ? "Trial aktiv" : "Trial"}
                              <ChevronDown size={9} />
                            </button>
                            {trialPop === u.id && (
                              <div className="absolute z-30 top-full left-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl py-1 min-w-[150px]">
                                {TRIAL_OPTIONS.map(({ days, label }) =>
                                  PLAN_OPTIONS.filter((o) => o.value !== "free").map((planOpt) => (
                                    <button
                                      key={`${planOpt.value}-${days}`}
                                      onClick={() =>
                                        handlePlanChange(u.id, planOpt.value, {
                                          isTrial: true,
                                          trialDays: days,
                                        })
                                      }
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-elevated)] text-left text-xs text-[var(--text-base)]"
                                    >
                                      <span className={`px-1.5 py-0.5 rounded-full font-bold ${planOpt.cls}`}>
                                        {planOpt.label}
                                      </span>
                                      {label} Trial
                                    </button>
                                  )),
                                )}
                                {u.is_trial && (
                                  <>
                                    <div className="my-1 border-t border-[var(--border)]" />
                                    <button
                                      onClick={() =>
                                        handlePlanChange(u.id, u.plan ?? "lite", {
                                          isTrial: false,
                                          expiresAt: null,
                                        })
                                      }
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-elevated)] text-left text-xs text-[var(--text-muted)]"
                                    >
                                      <Clock size={11} />
                                      Trial beenden
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Remove plan shortcut for non-free */}
                        {hasPlan && !isSelf && (
                          <button
                            disabled={!!pending[u.id + "_plan"]}
                            onClick={() => handleRemovePlan(u.id)}
                            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-red-400 hover:text-red-500 transition-colors"
                            title="Plan entfernen (auf Free setzen)"
                          >
                            <Ban size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Keine Nutzer in dieser Kategorie.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
