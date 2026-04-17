"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, MapPin, AlertTriangle, CreditCard, Star } from "lucide-react";
import type { OCMStation } from "@/app/api/stations/route";
import { StationTariffs } from "./StationTariffs";

interface StationDetailProps {
  station: OCMStation;
  onClose: () => void;
}

export function StationDetail({ station, onClose }: StationDetailProps) {
  const t = useTranslations("station");
  const [showReport, setShowReport] = useState(false);

  const addr = station.AddressInfo;
  const connections = station.Connections ?? [];
  const isOperational = station.StatusType?.IsOperational ?? null;
  const hasNoTariff = !station.UsageCost;

  return (
    <div className="bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-[var(--border)]">
        <div className="flex-1 min-w-0 pr-3">
          <h2 className="text-sm font-bold text-[var(--text-base)] truncate">
            {addr.Title}
          </h2>
          <p className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-0.5">
            <MapPin size={11} />
            {addr.AddressLine1}, {addr.Town} {addr.Postcode}
          </p>
          {station.OperatorInfo?.Title && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t("operator")}: {station.OperatorInfo.Title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOperational !== null && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isOperational
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {isOperational ? t("status_available", { fallback: "Verfügbar" }) : t("status_defect", { fallback: "Defekt" })}
            </span>
          )}
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-base)] p-1">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Connectors */}
      {connections.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            {t("connectors")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {connections.map((conn, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)] font-medium"
              >
                {conn.ConnectionType?.Title ?? `ID ${conn.ConnectionTypeID}`}
                {conn.PowerKW ? ` · ${conn.PowerKW} kW` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tariffs */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <StationTariffs
          stationId={String(station.ID)}
          lat={addr.Latitude}
          lng={addr.Longitude}
        />
      </div>

      {/* Ad-hoc hint */}
      {hasNoTariff && (
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-start gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-xl p-3">
            <CreditCard size={14} className="shrink-0 mt-0.5 text-[var(--primary)]" />
            <span>{t("adhoc_hint")}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={() => setShowReport(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
        >
          <AlertTriangle size={13} />
          {t("report_button")}
        </button>
        <button
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
        >
          <Star size={13} />
          {t("favorite_add")}
        </button>
      </div>

      {showReport && (
        <div className="px-4 pb-4">
          <CommunityReportForm
            stationId={String(station.ID)}
            stationName={addr.Title}
            lat={addr.Latitude}
            lng={addr.Longitude}
            onClose={() => setShowReport(false)}
          />
        </div>
      )}
    </div>
  );
}

// Inline community report form
function CommunityReportForm({
  stationId,
  stationName,
  lat,
  lng,
  onClose,
}: {
  stationId: string;
  stationName: string;
  lat: number;
  lng: number;
  onClose: () => void;
}) {
  const t = useTranslations("report");
  const [reportType, setReportType] = useState<"available" | "occupied" | "defect" | "price_correction">("available");
  const [description, setDescription] = useState("");
  const [priceKwh, setPriceKwh] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationId,
        stationName,
        lat,
        lng,
        reportType,
        description,
        priceKwh: priceKwh ? parseFloat(priceKwh) : null,
      }),
    });

    if (res.ok) {
      setDone(true);
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="bg-[var(--primary-light-soft)] border border-[var(--primary-light)] text-[var(--primary)] rounded-xl px-4 py-3 text-sm text-center">
        {t("success")}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-[var(--border)] rounded-xl p-3 mt-2 space-y-3">
      <p className="text-xs font-bold text-[var(--text-base)]">{t("title")}</p>
      <div className="flex flex-wrap gap-1">
        {(["available", "occupied", "defect", "price_correction"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setReportType(type)}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
              reportType === type
                ? "bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]"
            }`}
          >
            {t(`type_${type}` as "type_available" | "type_occupied" | "type_defect" | "type_price")}
          </button>
        ))}
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("description_label", { fallback: "Beschreibung (optional)" })}
        rows={2}
        className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-xs focus:outline-none focus:border-[var(--primary)] resize-none"
      />
      {reportType === "price_correction" && (
        <input
          type="number"
          step="0.01"
          value={priceKwh}
          onChange={(e) => setPriceKwh(e.target.value)}
          placeholder={t("price_label")}
          className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-xs focus:outline-none focus:border-[var(--primary)]"
        />
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-colors"
        >
          {t("submit")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="py-2 px-3 rounded-lg border border-[var(--border)] text-[var(--text-muted)] text-xs hover:bg-[var(--bg-elevated)] transition-colors"
        >
          ✕
        </button>
      </div>
    </form>
  );
}
