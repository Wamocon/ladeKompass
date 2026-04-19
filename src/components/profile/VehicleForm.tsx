"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save, X, Zap } from "lucide-react";
import { upsertVehicle } from "@/lib/actions/vehicles";
import type { Vehicle, VehicleUpsertInput } from "@/lib/actions/vehicles";
import { EV_CATALOG, EV_BRANDS } from "@/lib/ev-catalog";

interface VehicleFormProps {
  vehicle?: Vehicle;
  onDone: () => void;
}

const CONNECTOR_TYPES = ["type2", "ccs", "chademo", "tesla_ccs"] as const;
const CONNECTOR_LABELS: Record<string, string> = {
  type2: "Type 2 (AC)",
  ccs: "CCS2 (DC)",
  chademo: "CHAdeMO (DC)",
  tesla_ccs: "Tesla CCS (DC)",
};

export function VehicleForm({ vehicle, onDone }: VehicleFormProps) {
  const t = useTranslations("vehicle");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>(vehicle?.brand ?? "");

  const [form, setForm] = useState<VehicleUpsertInput>({
    id: vehicle?.id,
    name: vehicle?.name ?? "",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    battery_kwh: vehicle?.battery_kwh ?? 60,
    max_charge_kw: vehicle?.max_charge_kw ?? undefined,
    ac_charge_kw: vehicle?.ac_charge_kw ?? undefined,
    connector_type: vehicle?.connector_type ?? "ccs",
    is_default: vehicle?.is_default ?? false,
    year: vehicle?.year ?? undefined,
    color: vehicle?.color ?? "",
    license_plate: vehicle?.license_plate ?? "",
    vin: vehicle?.vin ?? "",
    purchase_date: vehicle?.purchase_date ?? "",
    mileage_km: vehicle?.mileage_km ?? undefined,
    range_km: vehicle?.range_km ?? undefined,
    notes: vehicle?.notes ?? "",
    insurance_expiry: vehicle?.insurance_expiry ?? "",
    tuev_expiry: vehicle?.tuev_expiry ?? "",
    preferred_soc_min: vehicle?.preferred_soc_min ?? 20,
    preferred_soc_max: vehicle?.preferred_soc_max ?? 80,
    efficiency_kwh_per_100km: vehicle?.efficiency_kwh_per_100km ?? undefined,
  });

  const brandModels = selectedBrand ? (EV_CATALOG[selectedBrand] ?? []) : [];

  function handleBrandSelect(brand: string) {
    setSelectedBrand(brand);
    setForm((prev) => ({ ...prev, brand, model: "", battery_kwh: 60, max_charge_kw: undefined, connector_type: "ccs" }));
  }

  function handleModelSelect(modelName: string) {
    const ev = brandModels.find((m) => m.model === modelName);
    if (!ev) return;
    setForm((prev) => ({
      ...prev,
      brand: ev.brand,
      model: ev.model,
      battery_kwh: ev.battery_kwh,
      max_charge_kw: ev.max_charge_kw,
      connector_type: ev.connector_type,
      range_km: ev.range_km,
      // Auto-generate name if still empty
      name: prev.name || ev.model,
    }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? (value === "" ? undefined : parseFloat(value))
          : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarning(null);
    startTransition(async () => {
      const res = await upsertVehicle(form);
      if (res.error) setError(res.error);
      else if (res.warning) setWarning(res.warning);
      else onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick-Select: Hersteller */}
      <div>
        <label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5">
          Hersteller ausw&#228;hlen
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          {EV_BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => handleBrandSelect(brand)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                selectedBrand === brand
                  ? "bg-(--primary) text-white border-(--primary)"
                  : "border-(--border) text-(--text-muted) hover:border-(--primary) hover:text-(--primary)"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Quick-Select: Modell (wenn Hersteller gewählt) */}
      {brandModels.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5">
            Modell &amp; Daten automatisch &#252;bernehmen
          </label>
          <select
            onChange={(e) => handleModelSelect(e.target.value)}
            value={form.model ?? ""}
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) focus:outline-none focus:ring-2 focus:ring-(--primary)"
          >
            <option value="">&#8211; Modell w&#228;hlen &#8211;</option>
            {brandModels.map((m) => (
              <option key={m.model} value={m.model}>
                {m.model} &middot; {m.battery_kwh} kWh &middot; bis {m.max_charge_kw} kW
                {m.range_km ? ` \u00b7 ~${m.range_km} km` : ""}
              </option>
            ))}
          </select>
          {form.model && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <Zap size={11} />
              Daten für &bdquo;{form.model}&ldquo; automatisch befüllt
            </div>
          )}
        </div>
      )}

      <hr className="border-(--border)" />

      {/* ── Abschnitt 1: Basis ── */}
      <p className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Fahrzeugdaten</p>

      <div>
        <label className="block text-xs font-medium text-(--text-muted) mb-1">
          {t("name", { fallback: "Bezeichnung*" })}
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder={t("name_placeholder", { fallback: "z.B. Mein Tesla" })}
          className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Hersteller</label>
          <input name="brand" value={form.brand ?? ""} onChange={handleChange} placeholder="Tesla, VW, BMW…"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Modell</label>
          <input name="model" value={form.model ?? ""} onChange={handleChange} placeholder="Model 3, ID.4…"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Baujahr</label>
          <input name="year" type="number" value={form.year ?? ""} onChange={handleChange}
            min="2010" max={new Date().getFullYear() + 1} placeholder="2023"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Farbe</label>
          <input name="color" value={form.color ?? ""} onChange={handleChange} placeholder="Weiß, Schwarz…"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Kennzeichen</label>
          <input name="license_plate" value={form.license_plate ?? ""} onChange={handleChange} placeholder="F-AB 1234"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) uppercase" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">FIN / VIN</label>
          <input name="vin" value={form.vin ?? ""} onChange={handleChange} placeholder="WDB1230001A123456"
            maxLength={17}
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) uppercase font-mono text-xs" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Kilometerstand</label>
          <input name="mileage_km" type="number" value={form.mileage_km ?? ""} onChange={handleChange}
            min="0" max="999999" step="100" placeholder="12.500"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Kaufdatum</label>
          <input name="purchase_date" type="date" value={form.purchase_date ?? ""} onChange={handleChange}
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Versicherung bis</label>
          <input name="insurance_expiry" type="date" value={form.insurance_expiry ?? ""} onChange={handleChange}
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">TÜV/HU fällig</label>
          <input name="tuev_expiry" type="date" value={form.tuev_expiry ?? ""} onChange={handleChange}
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
      </div>

      <hr className="border-(--border)" />

      {/* ── Abschnitt 2: Ladetechnik ── */}
      <p className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Ladetechnik</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Akkugröße (kWh)*</label>
          <input name="battery_kwh" value={form.battery_kwh} onChange={handleChange} type="number"
            min="10" max="200" step="0.5" required
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">WLTP-Reichweite (km)</label>
          <input name="range_km" type="number" value={form.range_km ?? ""} onChange={handleChange}
            min="50" max="1500" step="1" placeholder="500"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">DC-Max. (kW)</label>
          <input name="max_charge_kw" value={form.max_charge_kw ?? ""} onChange={handleChange} type="number"
            min="3" max="350" step="0.5" placeholder="250"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">AC-Max. (kW)</label>
          <input name="ac_charge_kw" type="number" value={form.ac_charge_kw ?? ""} onChange={handleChange}
            min="1.4" max="22" step="0.1" placeholder="11"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Verbrauch (kWh/100km)</label>
          <input name="efficiency_kwh_per_100km" type="number" value={form.efficiency_kwh_per_100km ?? ""} onChange={handleChange}
            min="10" max="40" step="0.1" placeholder="17.5"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">Steckertyp</label>
          <select name="connector_type" value={form.connector_type ?? "ccs"} onChange={handleChange}
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) focus:outline-none focus:ring-2 focus:ring-(--primary)">
            {CONNECTOR_TYPES.map((c) => (
              <option key={c} value={c}>{CONNECTOR_LABELS[c] ?? c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lade-SoC-Präferenz */}
      <div>
        <label className="block text-xs font-medium text-(--text-muted) mb-2">
          Lade-Fenster (SoC): {form.preferred_soc_min ?? 20}% → {form.preferred_soc_max ?? 80}%
          <span className="ml-2 text-[10px] text-(--text-muted) font-normal">(optimaler Akkubereich)</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-(--text-muted) w-8">Min</span>
          <input type="range" name="preferred_soc_min" min="5" max="50" step="5"
            value={form.preferred_soc_min ?? 20} onChange={handleChange}
            className="flex-1 accent-[var(--primary)]" />
          <span className="text-xs font-bold text-amber-500 w-8">{form.preferred_soc_min ?? 20}%</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-(--text-muted) w-8">Max</span>
          <input type="range" name="preferred_soc_max" min="60" max="100" step="5"
            value={form.preferred_soc_max ?? 80} onChange={handleChange}
            className="flex-1 accent-[var(--primary)]" />
          <span className="text-xs font-bold text-green-600 w-8">{form.preferred_soc_max ?? 80}%</span>
        </div>
      </div>

      <hr className="border-(--border)" />

      {/* ── Abschnitt 3: Notizen ── */}
      <p className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Notizen</p>
      <textarea
        name="notes"
        value={form.notes ?? ""}
        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        rows={3}
        placeholder="z.B. Sonderausstattung, Garantieinfos, Wartungsnotizen…"
        className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) resize-none"
      />

      <label className="flex items-center gap-2 text-sm text-(--text-base) cursor-pointer">
        <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange}
          className="rounded border-(--border) text-(--primary)" />
        {t("set_default", { fallback: "Als Standard-Fahrzeug verwenden" })}
      </label>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {warning && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          {warning}
          <button type="button" onClick={onDone} className="ml-2 underline font-semibold">Schließen</button>
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-(--primary) hover:bg-(--primary-hover) text-white font-semibold text-sm py-2.5 transition-colors disabled:opacity-60">
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {t("save", { fallback: "Speichern" })}
        </button>
        <button type="button" onClick={onDone}
          className="flex items-center gap-1.5 rounded-xl border border-(--border) px-4 py-2 text-sm text-(--text-muted) hover:bg-(--bg-elevated) transition-colors">
          <X size={14} />
          {t("cancel", { fallback: "Abbrechen" })}
        </button>
      </div>
    </form>
  );
}