"use client";

import { useState, useRef, useEffect } from "react";
import {
  Crown, Shield, User, Loader2, ChevronDown, Check, Pencil, X,
} from "lucide-react";
import {
  updateUserPlan,
  updateUserRole,
  updateUserDisplayName,
} from "@/lib/actions/admin";

export interface UserProfile {
  id: string;
  display_name: string | null;
  plan: string | null;
  role: string | null;
  created_at: string;
}

interface Props {
  users: UserProfile[];
  emailMap: Record<string, string>;
  currentUserRole: string;
  currentUserId: string;
}

const PLAN_OPTIONS = [
  { value: "free", label: "Free", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  { value: "lite", label: "Lite", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "pro",  label: "PRO",  cls: "bg-[var(--primary)] text-white" },
] as const;

const ROLE_OPTIONS = [
  {
    value: "driver",
    label: "Driver",
    icon: <User size={12} className="text-[var(--text-muted)]" />,
  },
  {
    value: "admin",
    label: "Admin",
    icon: <Shield size={12} className="text-[var(--primary)]" />,
  },
  {
    value: "super_admin",
    label: "Super-Admin",
    icon: <Crown size={12} className="text-yellow-500" />,
  },
] as const;

export function AdminUsersTable({
  users,
  emailMap,
  currentUserRole,
  currentUserId,
}: Props) {
  const [localUsers, setLocalUsers] = useState(users);
  const [planPop, setPlanPop]   = useState<string | null>(null);
  const [rolePop, setRolePop]   = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameInput, setNameInput]     = useState("");
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLocalUsers(users); }, [users]);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPlanPop(null);
        setRolePop(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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

  async function handlePlan(uid: string, plan: string) {
    if (localUsers.find((u) => u.id === uid)?.plan === plan) {
      setPlanPop(null);
      return;
    }
    setPlanPop(null);
    setPend(uid + "_plan", true);
    const res = await updateUserPlan(uid, plan as "free" | "lite" | "pro");
    setPend(uid + "_plan", false);
    if (res.error) return showToast(res.error, false);
    setLocalUsers((us) => us.map((u) => (u.id === uid ? { ...u, plan } : u)));
    showToast("Plan aktualisiert ✓");
  }

  async function handleRole(uid: string, role: string) {
    if (localUsers.find((u) => u.id === uid)?.role === role) {
      setRolePop(null);
      return;
    }
    setRolePop(null);
    setPend(uid + "_role", true);
    const res = await updateUserRole(uid, role as "driver" | "admin" | "super_admin");
    setPend(uid + "_role", false);
    if (res.error) return showToast(res.error, false);
    setLocalUsers((us) => us.map((u) => (u.id === uid ? { ...u, role } : u)));
    showToast("Rolle aktualisiert ✓");
  }

  async function handleNameSave(uid: string) {
    setEditingName(null);
    const trimmed = nameInput.trim();
    const current = localUsers.find((u) => u.id === uid)?.display_name ?? "";
    if (!trimmed || trimmed === current) return;
    setPend(uid + "_name", true);
    const res = await updateUserDisplayName(uid, trimmed);
    setPend(uid + "_name", false);
    if (res.error) return showToast(res.error, false);
    setLocalUsers((us) => us.map((u) => (u.id === uid ? { ...u, display_name: trimmed } : u)));
    showToast("Name aktualisiert ✓");
  }

  const isSuperAdmin = currentUserRole === "super_admin";

  return (
    <div ref={containerRef} className="relative">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl transition-all ${
            toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Nutzer
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Rolle
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Seit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {localUsers.map((p) => {
                const isSelf   = p.id === currentUserId;
                const planOpt  = PLAN_OPTIONS.find((o) => o.value === (p.plan ?? "free")) ?? PLAN_OPTIONS[0];
                const roleOpt  = ROLE_OPTIONS.find((o) => o.value === (p.role ?? "driver")) ?? ROLE_OPTIONS[0];
                const nameEdit = editingName === p.id;

                return (
                  <tr key={p.id} className="hover:bg-[var(--bg-elevated)] transition-colors group">
                    {/* ── Name + Email ─────────────────────────────────── */}
                    <td className="px-4 py-3">
                      {nameEdit ? (
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleNameSave(p.id); }}
                          className="flex items-center gap-2"
                        >
                          <input
                            autoFocus
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            onBlur={() => handleNameSave(p.id)}
                            className="text-sm border border-[var(--border)] rounded-lg px-2 py-1 bg-[var(--bg-elevated)] text-[var(--text-base)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-44"
                          />
                          <button type="submit" className="p-1 text-green-500 hover:text-green-400">
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingName(null)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-base)]"
                          >
                            <X size={14} />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-start gap-2 group/name">
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--text-base)] truncate">
                              {p.display_name ?? "—"}
                              {pending[p.id + "_name"] && (
                                <Loader2 size={10} className="inline ml-1 animate-spin" />
                              )}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] font-mono truncate">
                              {emailMap[p.id] ?? p.id.slice(0, 8) + "…"}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setEditingName(p.id);
                              setNameInput(p.display_name ?? "");
                            }}
                            className="opacity-0 group-hover/name:opacity-100 shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-opacity"
                            title="Name bearbeiten"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* ── Plan popover ──────────────────────────────────── */}
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <button
                          disabled={isSelf || !!pending[p.id + "_plan"]}
                          onClick={() => setPlanPop(planPop === p.id ? null : p.id)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold transition-opacity ${planOpt.cls} ${
                            isSelf ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"
                          }`}
                        >
                          {pending[p.id + "_plan"] ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : null}
                          {planOpt.label}
                          {!isSelf && <ChevronDown size={9} />}
                        </button>
                        {planPop === p.id && (
                          <div className="absolute z-20 top-full left-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl py-1 min-w-[110px]">
                            {PLAN_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handlePlan(p.id, opt.value)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-elevated)] text-left"
                              >
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${opt.cls}`}>
                                  {opt.label}
                                </span>
                                {(p.plan ?? "free") === opt.value && (
                                  <Check size={11} className="text-green-500 ml-auto" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ── Role popover (super_admin only) ───────────────── */}
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <button
                          disabled={!isSuperAdmin || isSelf || !!pending[p.id + "_role"]}
                          onClick={() =>
                            isSuperAdmin && !isSelf &&
                            setRolePop(rolePop === p.id ? null : p.id)
                          }
                          className={`flex items-center gap-1.5 text-[var(--text-muted)] text-xs ${
                            isSuperAdmin && !isSelf
                              ? "cursor-pointer hover:text-[var(--text-base)]"
                              : "cursor-default"
                          }`}
                        >
                          {pending[p.id + "_role"] ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            roleOpt.icon
                          )}
                          <span className="capitalize">{p.role ?? "driver"}</span>
                          {isSuperAdmin && !isSelf && <ChevronDown size={9} />}
                        </button>
                        {rolePop === p.id && isSuperAdmin && (
                          <div className="absolute z-20 top-full left-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl py-1 min-w-[150px]">
                            {ROLE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleRole(p.id, opt.value)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-elevated)] text-left text-xs text-[var(--text-base)]"
                              >
                                {opt.icon}
                                <span>{opt.label}</span>
                                {(p.role ?? "driver") === opt.value && (
                                  <Check size={11} className="text-green-500 ml-auto" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ── Datum ─────────────────────────────────────────── */}
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {new Date(p.created_at).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                );
              })}
              {localUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Keine Nutzer gefunden.
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
