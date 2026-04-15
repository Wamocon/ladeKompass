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
  const [selectedBrand, setSelectedBrand] = useState<string>(vehicle?.brand ?? "");

  const [form, setForm] = useState<VehicleUpsertInput>({
    id: vehicle?.id,
    name: vehicle?.name ?? "",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    battery_kwh: vehicle?.battery_kwh ?? 60,
    max_charge_kw: vehicle?.max_charge_kw ?? undefined,
    connector_type: vehicle?.connector_type ?? "ccs",
    is_default: vehicle?.is_default ?? false,
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
          ? parseFloat(value) || 0
          : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await upsertVehicle(form);
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick-Select: Hersteller */}
      <div>
        <label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5">
          Hersteller auswÃ¤hlen
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

      {/* Quick-Select: Modell (wenn Hersteller gewÃ¤hlt) */}
      {brandModels.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5">
            Modell & Daten automatisch Ã¼bernehmen
          </label>
          <select
            onChange={(e) => handleModelSelect(e.target.value)}
            value={form.model ?? ""}
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) focus:outline-none focus:ring-2 focus:ring-(--primary)"
          >
            <option value="">â€” Modell wÃ¤hlen â€”</option>
            {brandModels.map((m) => (
              <option key={m.model} value={m.model}>
                {m.model} Â· {m.battery_kwh} kWh Â· bis {m.max_charge_kw} kW
                {m.range_km ? ` Â· ~${m.range_km} km` : ""}
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

      {/* Bezeichnung */}
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
          <label className="block text-xs font-medium text-(--text-muted) mb-1">
            {t("brand", { fallback: "Hersteller" })}
          </label>
          <input
            name="brand"
            value={form.brand ?? ""}
            onChange={handleChange}
            placeholder="Tesla, VW, BMWâ€¦"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">
            {t("model", { fallback: "Modell" })}
          </label>
          <input
            name="model"
            value={form.model ?? ""}
            onChange={handleChange}
            placeholder="Model 3, ID.4â€¦"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">
            {t("battery_kwh", { fallback: "AkkugrÃ¶ÃŸe (kWh)*" })}
          </label>
          <input
            name="battery_kwh"
            value={form.battery_kwh}
            onChange={handleChange}
            type="number"
            min="10"
            max="200"
            step="0.5"
            required
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) focus:outline-none focus:ring-2 focus:ring-(--primary)"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-muted) mb-1">
            {t("max_charge_kw", { fallback: "Max. Ladeleistung (kW)" })}
          </label>
          <input
            name="max_charge_kw"
            value={form.max_charge_kw ?? ""}
            onChange={handleChange}
            type="number"
            min="3"
            max="350"
            step="0.5"
            placeholder="z.B. 250"
            className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-(--text-muted) mb-1">
          {t("connector_type", { fallback: "Steckertyp" })}
        </label>
        <select
          name="connector_type"
          value={form.connector_type ?? "ccs"}
          onChange={handleChange}
          className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm text-(--text-base) focus:outline-none focus:ring-2 focus:ring-(--primary)"
        >
          {CONNECTOR_TYPES.map((c) => (
            <option key={c} value={c}>
              {CONNECTOR_LABELS[c] ?? c}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-(--text-base) cursor-pointer">
        <input
          type="checkbox"
          name="is_default"
          checked={form.is_default}
          onChange={handleChange}
          className="rounded border-(--border) text-(--primary)"
        />
        {t("set_default", { fallback: "Als Standard-Fahrzeug verwenden" })}
      </label>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-(--primary) hover:bg-(--primary-hover) text-white font-semibold text-sm py-2.5 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {t("save", { fallback: "Speichern" })}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-1.5 rounded-xl border border-(--border) px-4 py-2 text-sm text-(--text-muted) hover:bg-(--bg-elevated) transition-colors"
        >
          <X size={14} />
          {t("cancel", { fallback: "Abbrechen" })}
        </button>
      </div>
    </form>
  );
}
