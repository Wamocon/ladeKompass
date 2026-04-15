"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Save, Loader2, Eye, EyeOff, Download, AlertTriangle,
  Bell, MapPin, Zap, User, Lock,
} from "lucide-react";
import { updateProfile, changePassword, exportMyData } from "@/lib/actions/profile";
import type { ProfileUpdateInput } from "@/lib/actions/profile";

interface ProfileState {
  display_name: string;
  phone: string;
  bio: string;
  home_address: string;
  work_address: string;
  notify_station_status: boolean;
  notify_news: boolean;
  notify_promotions: boolean;
  preferred_connector: string;
  min_charge_kw: number;
  charge_stop_soc: number;
}

export interface SettingsFormProps {
  initialProfile: {
    display_name?: string | null;
    phone?: string | null;
    bio?: string | null;
    home_address?: string | null;
    work_address?: string | null;
    notify_station_status?: boolean | null;
    notify_news?: boolean | null;
    notify_promotions?: boolean | null;
    preferred_connector?: string | null;
    min_charge_kw?: number | null;
    charge_stop_soc?: number | null;
  };
  userEmail: string;
}

type BoolNotifField = "notify_station_status" | "notify_news" | "notify_promotions";

const CONNECTOR_TYPES = ["", "type2", "ccs", "chademo", "tesla_ccs"] as const;
const CONNECTOR_LABELS: Record<string, string> = {
  "": "Egal / Alle",
  type2: "Type 2 (AC)",
  ccs: "CCS2 (DC)",
  chademo: "CHAdeMO (DC)",
  tesla_ccs: "Tesla CCS",
};

const inputCls =
  "w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) focus:outline-none focus:ring-2 focus:ring-(--primary)";

export function SettingsForm({ initialProfile, userEmail }: SettingsFormProps) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  const [profile, setProfile] = useState<ProfileState>({
    display_name: initialProfile.display_name ?? "",
    phone: initialProfile.phone ?? "",
    bio: initialProfile.bio ?? "",
    home_address: initialProfile.home_address ?? "",
    work_address: initialProfile.work_address ?? "",
    notify_station_status: initialProfile.notify_station_status ?? true,
    notify_news: initialProfile.notify_news ?? false,
    notify_promotions: initialProfile.notify_promotions ?? false,
    preferred_connector: initialProfile.preferred_connector ?? "",
    min_charge_kw: initialProfile.min_charge_kw ?? 11,
    charge_stop_soc: initialProfile.charge_stop_soc ?? 80,
  });

  const [pwForm, setPwForm] = useState({ newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [msgs, setMsgs] = useState<Record<string, string>>({});

  function setMsg(key: string, msg: string) {
    setMsgs((prev) => ({ ...prev, [key]: msg }));
    setTimeout(
      () => setMsgs((prev) => { const n = { ...prev }; delete n[key]; return n; }),
      3000,
    );
  }

  function saveSection(key: string, data: ProfileUpdateInput) {
    startTransition(async () => {
      const res = await updateProfile(data);
      setMsg(key, res.error ? `Fehler: ${res.error}` : "Gespeichert \u2713");
    });
  }

  async function toggleNotif(field: BoolNotifField, value: boolean) {
    setProfile((p) => ({ ...p, [field]: value }));
    const res = await updateProfile({ [field]: value });
    if (res.error) setMsg("notif", `Fehler: ${res.error}`);
  }

  function handleChangePw() {
    if (pwForm.newPassword !== pwForm.confirm) { setMsg("pw", "Passw\u00f6rter stimmen nicht \u00fcberein"); return; }
    if (pwForm.newPassword.length < 8) { setMsg("pw", "Mindestens 8 Zeichen erforderlich"); return; }
    startTransition(async () => {
      const res = await changePassword(pwForm.newPassword);
      if (res.error) setMsg("pw", `Fehler: ${res.error}`);
      else { setPwForm({ newPassword: "", confirm: "" }); setMsg("pw", "Passwort ge\u00e4ndert \u2713"); }
    });
  }

  async function handleExport() {
    const res = await exportMyData();
    if (res.error || !res.data) return;
    const blob = new Blob([res.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "meine-daten.json"; a.click();
    URL.revokeObjectURL(url);
  }

  const Msg = ({ k }: { k: string }) =>
    msgs[k] ? (
      <span className={`text-xs ${msgs[k].includes("\u2713") ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
        {msgs[k]}
      </span>
    ) : null;

  const SaveButton = ({ section, onClick }: { section: string; onClick: () => void }) => (
    <button
      type="button"
      disabled={isPending}
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl bg-(--primary) hover:bg-(--primary-hover) text-white text-xs font-semibold px-3 py-1.5 transition-colors disabled:opacity-60"
    >
      {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
      {t("save", { fallback: "Speichern" })}
      <span className="sr-only">({section})</span>
    </button>
  );

  return (
    <div className="space-y-5">

      {/* 1. Profil */}
      <section className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-(--primary)" />
          <h2 className="text-sm font-bold text-(--text-base)">{t("profile_title", { fallback: "Profil" })}</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-(--text-muted) mb-1">Anzeigename</label>
            <input
              value={profile.display_name}
              onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
              placeholder="Wie sollen andere dich sehen?"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-(--text-muted) mb-1">E-Mail</label>
            <input value={userEmail} readOnly className={`${inputCls} opacity-70 cursor-not-allowed`} />
            <p className="text-[11px] text-(--text-muted) mt-1">E-Mail kann nicht geändert werden.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-(--text-muted) mb-1">Telefon (optional)</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+49 170 1234567"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-(--text-muted) mb-1">Bio (optional)</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              rows={2}
              placeholder="Kurze Beschreibung über dich…"
              className={`${inputCls} resize-none placeholder:text-(--text-muted)`}
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <SaveButton
              section="profile"
              onClick={() => saveSection("profile", {
                display_name: profile.display_name || undefined,
                phone: profile.phone || undefined,
                bio: profile.bio || undefined,
              })}
            />
            <Msg k="profile" />
          </div>
        </div>
      </section>

      {/* 2. Standorte */}
      <section className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-(--primary)" />
          <h2 className="text-sm font-bold text-(--text-base)">{t("locations_title", { fallback: "Meine Standorte" })}</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-(--text-muted) mb-1">Heimatadresse</label>
            <input
              value={profile.home_address}
              onChange={(e) => setProfile((p) => ({ ...p, home_address: e.target.value }))}
              placeholder="Musterstraße 1, 60311 Frankfurt"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-(--text-muted) mb-1">Arbeitsadresse</label>
            <input
              value={profile.work_address}
              onChange={(e) => setProfile((p) => ({ ...p, work_address: e.target.value }))}
              placeholder="Büropark 2, 60549 Frankfurt"
              className={inputCls}
            />
          </div>
          <p className="text-[11px] text-(--text-muted)">Wird für Routenvorschläge und Umkreissuche verwendet.</p>
          <div className="flex items-center justify-between pt-1">
            <SaveButton
              section="locations"
              onClick={() => saveSection("locations", {
                home_address: profile.home_address || undefined,
                work_address: profile.work_address || undefined,
              })}
            />
            <Msg k="locations" />
          </div>
        </div>
      </section>

      {/* 3. Benachrichtigungen */}
      <section className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-(--primary)" />
          <h2 className="text-sm font-bold text-(--text-base)">{t("notifications_title", { fallback: "Benachrichtigungen" })}</h2>
        </div>
        <Msg k="notif" />
        <div className="space-y-4 mt-1">
          {(
            [
              ["notify_station_status", "Ladestationen-Updates", "Status\u00e4nderungen an favorisierten Stationen"],
              ["notify_news", "Neuigkeiten & Features", "Updates zu neuen LadeKompass-Features"],
              ["notify_promotions", "Angebote & Aktionen", "Ladepreis-Aktionen und Partnernews"],
            ] as const
          ).map(([field, label, desc]) => (
            <label key={field} className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={profile[field]}
                  onChange={(e) => toggleNotif(field, e.target.checked)}
                />
                <div className={`relative w-10 h-5 rounded-full transition-colors ${profile[field] ? "bg-(--primary)" : "bg-(--bg-elevated) border border-(--border)"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-[left] duration-150 ${profile[field] ? "left-5" : "left-0.5"}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-(--text-base)">{label}</p>
                <p className="text-xs text-(--text-muted)">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* 4. Ladeeinstellungen */}
      <section className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-(--primary)" />
          <h2 className="text-sm font-bold text-(--text-base)">{t("charging_title", { fallback: "Ladeeinstellungen" })}</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-(--text-muted) mb-1">Bevorzugter Steckertyp</label>
            <select
              value={profile.preferred_connector}
              onChange={(e) => setProfile((p) => ({ ...p, preferred_connector: e.target.value }))}
              className={inputCls}
            >
              {CONNECTOR_TYPES.map((c) => (
                <option key={c} value={c}>{CONNECTOR_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-(--text-muted) mb-2">
              Min. Ladeleistung:{" "}
              <span className="font-bold text-(--text-base)">{profile.min_charge_kw} kW</span>
            </label>
            <input
              type="range" min="3.7" max="350" step="0.1"
              value={profile.min_charge_kw}
              onChange={(e) => setProfile((p) => ({ ...p, min_charge_kw: parseFloat(e.target.value) }))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="flex justify-between text-[10px] text-(--text-muted) mt-0.5">
              <span>3.7 kW</span><span>350 kW</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-(--text-muted) mb-2">
              Lade-Stop bei:{" "}
              <span className="font-bold text-(--text-base)">{profile.charge_stop_soc}%</span>
            </label>
            <input
              type="range" min="60" max="100" step="5"
              value={profile.charge_stop_soc}
              onChange={(e) => setProfile((p) => ({ ...p, charge_stop_soc: parseInt(e.target.value, 10) }))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="flex justify-between text-[10px] text-(--text-muted) mt-0.5">
              <span>60%</span><span>100%</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <SaveButton
              section="charging"
              onClick={() => saveSection("charging", {
                preferred_connector: profile.preferred_connector || undefined,
                min_charge_kw: profile.min_charge_kw,
                charge_stop_soc: profile.charge_stop_soc,
              })}
            />
            <Msg k="charging" />
          </div>
        </div>
      </section>

      {/* 5. Passwort */}
      <section className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-(--primary)" />
          <h2 className="text-sm font-bold text-(--text-base)">{t("password_title", { fallback: "Passwort \u00e4ndern" })}</h2>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <label className="block text-xs font-medium text-(--text-muted) mb-1">Neues Passwort</label>
            <input
              type={showPw ? "text" : "password"}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="Mindestens 8 Zeichen"
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 bottom-2.5 text-(--text-muted) hover:text-(--text-base)"
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-(--text-muted) mb-1">Passwort bestätigen</label>
            <input
              type={showPw ? "text" : "password"}
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="Nochmals eingeben"
              className={inputCls}
            />
          </div>
          <Msg k="pw" />
          <button
            type="button"
            disabled={isPending || !pwForm.newPassword}
            onClick={handleChangePw}
            className="flex items-center gap-1.5 rounded-xl bg-(--primary) hover:bg-(--primary-hover) text-white text-xs font-semibold px-3 py-1.5 transition-colors disabled:opacity-60"
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Passwort ändern
          </button>
        </div>
      </section>

      {/* 6. DSGVO & Konto */}
      <section className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download size={16} className="text-(--primary)" />
          <h2 className="text-sm font-bold text-(--text-base)">{t("data_title", { fallback: "Meine Daten (DSGVO)" })}</h2>
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-xs text-(--text-muted) mb-3">
              Du kannst jederzeit alle bei uns gespeicherten Daten als JSON-Datei exportieren.
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-xl border border-(--border) px-3 py-1.5 text-xs font-semibold text-(--text-muted) hover:border-(--primary) hover:text-(--primary) transition-colors"
            >
              <Download size={12} /> Alle Daten exportieren
            </button>
          </div>
          <hr className="border-(--border)" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-500" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">Konto löschen</p>
            </div>
            <p className="text-xs text-(--text-muted)">
              Alle Daten werden unwiderruflich gelöscht. Bitte kontaktiere uns unter{" "}
              <a href="mailto:datenschutz@ladekompass.de" className="underline text-(--primary)">
                datenschutz@ladekompass.de
              </a>.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
