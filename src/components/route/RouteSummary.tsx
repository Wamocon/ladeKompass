"use client";

import { useTranslations } from "next-intl";
import { Zap, Euro } from "lucide-react";
import type { RouteResult } from "@/lib/actions/route";

interface RouteSummaryProps {
  result: RouteResult;
}

export function RouteSummary({ result }: RouteSummaryProps) {
  const t = useTranslations("route");

  const chargingStops = result.stops.filter((s) => s.energyAddedKwh);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {t("distance", { fallback: "Strecke" })}
          </p>
          <p className="text-base font-bold text-[var(--text-base)]">
            {result.totalDistanceKm} <span className="text-xs font-normal">km</span>
          </p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {t("duration", { fallback: "Dauer" })}
          </p>
          <p className="text-base font-bold text-[var(--text-base)]">
            {result.estimatedTimeMin}{" "}
            <span className="text-xs font-normal">{t("minutes", { fallback: "min" })}</span>
          </p>
        </div>
        <div className="bg-[var(--primary-light-soft)] border border-[var(--primary-light)] rounded-xl p-3 text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {t("est_cost", { fallback: "Lade-Kosten" })}
          </p>
          <p className="text-base font-bold text-[var(--primary)]">
            {result.totalEstimatedCostEur.toFixed(2)}{" "}
            <span className="text-xs font-normal">€</span>
          </p>
        </div>
      </div>

      {/* Route steps */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
          {t("route_steps", { fallback: "Route" })}
        </p>
        {result.stops.map((stop, i) => {
          const isStart = i === 0;
          const isEnd = i === result.stops.length - 1;
          const isCharging = !!stop.energyAddedKwh;

          return (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                isCharging
                  ? "border-[var(--primary)] bg-[var(--primary-light-soft)]"
                  : "border-[var(--border)] bg-[var(--bg-elevated)]"
              }`}
            >
              <div
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCharging
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                {isCharging ? <Zap size={13} /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--text-base)] truncate">
                  {stop.name}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                </p>
                {isCharging && (
                  <div className="flex flex-wrap gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-medium">
                      <Zap size={9} />
                      +{stop.energyAddedKwh?.toFixed(1)} kWh
                    </span>
                    {stop.estimatedCostEur != null && (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                        <Euro size={9} />
                        ~{stop.estimatedCostEur.toFixed(2)} €
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isStart && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold shrink-0">
                  {t("start_badge", { fallback: "Start" })}
                </span>
              )}
              {isEnd && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-semibold shrink-0">
                  {t("end_badge", { fallback: "Ziel" })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {chargingStops.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] text-center py-2">
          ✅{" "}
          {t("no_stop_needed", {
            fallback: "Kein Ladestopp nötig — du erreichst das Ziel mit ausreichend Akku.",
          })}
        </p>
      )}
    </div>
  );
}
