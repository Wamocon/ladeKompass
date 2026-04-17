"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, MapPin, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import type { SavedRouteRecord } from "@/lib/actions/route";

interface Props {
  initialRoutes: SavedRouteRecord[];
  deleteAction: (id: string) => Promise<{ error?: string }>;
}

export default function RouteArchiveClient({ initialRoutes, deleteAction }: Props) {
  const t = useTranslations("route");
  const [routes, setRoutes] = useState<SavedRouteRecord[]>(initialRoutes);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const { error } = await deleteAction(id);
      if (!error) {
        setRoutes((prev) => prev.filter((r) => r.id !== id));
      }
      setDeletingId(null);
    });
  }

  if (routes.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--text-muted)]">
        <MapPin size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t("archive_empty", { fallback: "Noch keine gespeicherten Routen." })}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {routes.map((route) => {
        const isOpen = expanded === route.id;
        const result = route.result;
        const stops = result?.stops ?? [];
        const from = stops[0]?.name ?? "–";
        const to = stops[stops.length - 1]?.name ?? "–";
        const chargingStops = stops.filter((s) => s.energyAddedKwh != null);
        const date = new Date(route.created_at).toLocaleDateString("de-DE", {
          day: "2-digit", month: "2-digit", year: "numeric",
        });

        return (
          <li
            key={route.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[var(--text-base)] truncate">
                  {route.name}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                  {from} → {to}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] shrink-0">
                <span className="flex items-center gap-1">
                  <MapPin size={11} />{result?.totalDistanceKm ?? 0} km
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />{Math.round((result?.estimatedTimeMin ?? 0) / 60)}h {(result?.estimatedTimeMin ?? 0) % 60}m
                </span>
                {chargingStops.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap size={11} />{chargingStops.length}×
                  </span>
                )}
                <span>{date}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(isOpen ? null : route.id)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors"
                  aria-label="Details"
                >
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(route.id)}
                  disabled={isPending && deletingId === route.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40"
                  aria-label={t("delete", { fallback: "Löschen" })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--bg-elevated)] space-y-2">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  {t("stops", { fallback: "Haltepunkte" })}
                </p>
                {stops.map((stop, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                      i === 0 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      : i === stops.length - 1 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                    }`}>
                      {i === 0 ? "A" : i === stops.length - 1 ? "B" : "⚡"}
                    </span>
                    <div>
                      <p className="text-[var(--text-base)] font-medium">{stop.name}</p>
                      {stop.energyAddedKwh != null && (
                        <p className="text-[var(--text-muted)]">
                          +{stop.energyAddedKwh.toFixed(1)} kWh
                          {stop.estimatedCostEur != null ? ` · ca. ${stop.estimatedCostEur.toFixed(2)} €` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {result?.totalEstimatedCostEur != null && result.totalEstimatedCostEur > 0 && (
                  <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                    {t("total_cost", { fallback: "Gesamtkosten ca." })} {result.totalEstimatedCostEur.toFixed(2)} €
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
