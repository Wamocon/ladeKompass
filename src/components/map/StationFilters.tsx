"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";

export interface StationFiltersState {
  powerLevel: "ac" | "dc" | "hpc" | null;
  connectorType: "type2" | "ccs" | "chademo" | "tesla_ccs" | null;
}

interface StationFiltersProps {
  filters: StationFiltersState;
  onChange: (filters: StationFiltersState) => void;
}

export function StationFilters({ filters, onChange }: StationFiltersProps) {
  const t = useTranslations("map");
  const [open, setOpen] = useState(false);

  const hasActive = filters.powerLevel !== null || filters.connectorType !== null;

  function setPower(level: StationFiltersState["powerLevel"]) {
    onChange({ ...filters, powerLevel: filters.powerLevel === level ? null : level });
  }

  function setConnector(type: StationFiltersState["connectorType"]) {
    onChange({ ...filters, connectorType: filters.connectorType === type ? null : type });
  }

  function reset() {
    onChange({ powerLevel: null, connectorType: null });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium shadow transition-colors bg-[var(--bg-surface)]/95 backdrop-blur-sm ${
          hasActive
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-base)]"
        }`}
      >
        <SlidersHorizontal size={15} />
        {t("filter_title")}
        {hasActive && (
          <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center font-black">
            {(filters.powerLevel ? 1 : 0) + (filters.connectorType ? 1 : 0)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl p-4 z-[600]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--text-base)]">
              {t("filter_title")}
            </span>
            <div className="flex items-center gap-2">
              {hasActive && (
                <button
                  onClick={reset}
                  className="text-xs text-[var(--primary)] hover:underline font-medium"
                >
                  Reset
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-base)]">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                {t("filter_power")}
              </p>
              <div className="flex flex-col gap-1">
                {(["ac", "dc", "hpc"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setPower(level)}
                    className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filters.powerLevel === level
                        ? "bg-[var(--primary-light)] text-[var(--primary)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-base)]"
                    }`}
                  >
                    {t(`power_${level}` as "power_ac" | "power_dc" | "power_hpc")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                {t("filter_connector")}
              </p>
              <div className="flex flex-col gap-1">
                {(["type2", "ccs", "chademo", "tesla_ccs"] as const).map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setConnector(ct)}
                    className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filters.connectorType === ct
                        ? "bg-[var(--primary-light)] text-[var(--primary)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-base)]"
                    }`}
                  >
                    {t(`connector_${ct}` as "connector_type2" | "connector_ccs" | "connector_chademo" | "connector_tesla")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
