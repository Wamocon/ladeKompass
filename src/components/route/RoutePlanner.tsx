"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Navigation, Loader2, Info } from "lucide-react";
import { calculateRoute } from "@/lib/actions/route";
import type { RouteResult } from "@/lib/actions/route";
import { RouteSummary } from "./RouteSummary";

export function RoutePlanner() {
  const t = useTranslations("route");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    startName: "",
    startLat: "",
    startLng: "",
    endName: "",
    endLat: "",
    endLng: "",
    batteryKwh: "60",
    currentSoc: "80",
    minArrivalSoc: "15",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const startLat = parseFloat(form.startLat);
    const startLng = parseFloat(form.startLng);
    const endLat = parseFloat(form.endLat);
    const endLng = parseFloat(form.endLng);
    const batteryCapacityKwh = parseFloat(form.batteryKwh);
    const currentSocPercent = parseFloat(form.currentSoc);
    const minArrivalSocPercent = parseFloat(form.minArrivalSoc);

    if ([startLat, startLng, endLat, endLng, batteryCapacityKwh, currentSocPercent].some(isNaN)) {
      setError(t("validation_error", { fallback: "Bitte alle Felder korrekt ausfüllen." }));
      return;
    }

    startTransition(async () => {
      const res = await calculateRoute({
        startLat,
        startLng,
        startName: form.startName || `${startLat}, ${startLng}`,
        endLat,
        endLng,
        endName: form.endName || `${endLat}, ${endLng}`,
        batteryCapacityKwh,
        currentSocPercent,
        minArrivalSocPercent,
      });

      if (res.error === "QUOTA_EXCEEDED") {
        setError(t("quota_exceeded", { fallback: "Routen-Limit dieses Monats erreicht. Upgrade auf Pro für unbegrenzte Routen." }));
      } else {
        setResult(res);
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Start */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {t("start", { fallback: "Startpunkt" })}
          </legend>
          <input
            name="startName"
            value={form.startName}
            onChange={handleChange}
            placeholder={t("place_name", { fallback: "Ortsname (optional)" })}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="startLat"
              value={form.startLat}
              onChange={handleChange}
              placeholder={t("latitude", { fallback: "Breitengrad" })}
              type="number"
              step="any"
              required
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <input
              name="startLng"
              value={form.startLng}
              onChange={handleChange}
              placeholder={t("longitude", { fallback: "Längengrad" })}
              type="number"
              step="any"
              required
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        </fieldset>

        {/* End */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {t("destination", { fallback: "Ziel" })}
          </legend>
          <input
            name="endName"
            value={form.endName}
            onChange={handleChange}
            placeholder={t("place_name", { fallback: "Ortsname (optional)" })}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="endLat"
              value={form.endLat}
              onChange={handleChange}
              placeholder={t("latitude", { fallback: "Breitengrad" })}
              type="number"
              step="any"
              required
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <input
              name="endLng"
              value={form.endLng}
              onChange={handleChange}
              placeholder={t("longitude", { fallback: "Längengrad" })}
              type="number"
              step="any"
              required
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        </fieldset>

        {/* Vehicle */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {t("vehicle_params", { fallback: "Fahrzeugparameter" })}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                {t("battery_kwh", { fallback: "Akku (kWh)" })}
              </label>
              <input
                name="batteryKwh"
                value={form.batteryKwh}
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
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                {t("current_soc", { fallback: "Aktueller SoC %" })}
              </label>
              <input
                name="currentSoc"
                value={form.currentSoc}
                onChange={handleChange}
                type="number"
                min="5"
                max="100"
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                {t("min_arrival_soc", { fallback: "Min. Ankunft %" })}
              </label>
              <input
                name="minArrivalSoc"
                value={form.minArrivalSoc}
                onChange={handleChange}
                type="number"
                min="5"
                max="50"
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
        </fieldset>

        {error && (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            <Info size={13} />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm py-2.5 transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Navigation size={15} />
          )}
          {isPending
            ? t("calculating", { fallback: "Berechne Route…" })
            : t("calculate", { fallback: "Route berechnen" })}
        </button>
      </form>

      {result && <RouteSummary result={result} />}
    </div>
  );
}
