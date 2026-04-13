"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save, X } from "lucide-react";
import { upsertVehicle } from "@/lib/actions/vehicles";
import type { Vehicle, VehicleUpsertInput } from "@/lib/actions/vehicles";

interface VehicleFormProps {
  vehicle?: Vehicle;
  onDone: () => void;
}

const CONNECTOR_TYPES = ["type2", "ccs", "chademo", "tesla_ccs"] as const;

export function VehicleForm({ vehicle, onDone }: VehicleFormProps) {
  const t = useTranslations("vehicle");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
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
      if (res.error) {
        setError(res.error);
      } else {
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
          {t("name", { fallback: "Bezeichnung*" })}
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder={t("name_placeholder", { fallback: "z.B. Mein Tesla" })}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            {t("brand", { fallback: "Hersteller" })}
          </label>
          <input
            name="brand"
            value={form.brand ?? ""}
            onChange={handleChange}
            placeholder="Tesla, VW, BMW…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            {t("model", { fallback: "Modell" })}
          </label>
          <input
            name="model"
            value={form.model ?? ""}
            onChange={handleChange}
            placeholder="Model 3, ID.4…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            {t("battery_kwh", { fallback: "Akkugröße (kWh)*" })}
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
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            {t("max_charge_kw", { fallback: "Ladeleistung (kW)" })}
          </label>
          <input
            name="max_charge_kw"
            value={form.max_charge_kw ?? ""}
            onChange={handleChange}
            type="number"
            min="3"
            max="350"
            step="0.5"
            placeholder="150"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
          {t("connector_type", { fallback: "Steckertyp" })}
        </label>
        <select
          name="connector_type"
          value={form.connector_type ?? "ccs"}
          onChange={handleChange}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          {CONNECTOR_TYPES.map((c) => (
            <option key={c} value={c}>
              {c.toUpperCase().replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--text-base)] cursor-pointer">
        <input
          type="checkbox"
          name="is_default"
          checked={form.is_default}
          onChange={handleChange}
          className="rounded border-[var(--border)] text-[var(--primary)]"
        />
        {t("set_default", { fallback: "Als Standard-Fahrzeug verwenden" })}
      </label>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm py-2 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {t("save", { fallback: "Speichern" })}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <X size={14} />
          {t("cancel", { fallback: "Abbrechen" })}
        </button>
      </div>
    </form>
  );
}
