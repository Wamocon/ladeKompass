"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Zap, TrendingDown, Clock, ExternalLink, Info } from "lucide-react";

interface Tariff {
  id: string;
  name: string;
  price?: number;
  pricePerKwh?: number;
  pricePerMinute?: number;
  baseFee?: number;
  blockingFee?: number;
  currency: string;
}

interface StationTariffsProps {
  stationId: string;
  lat: number;
  lng: number;
  /** Raw OCM UsageCost text — shown as fallback when no structured tariffs available */
  usageCost?: string | null;
  /** Operator website URL — shown as "check at operator" link */
  operatorUrl?: string | null;
}

export function StationTariffs({ stationId, lat, lng, usageCost, operatorUrl }: StationTariffsProps) {
  const t = useTranslations("tariff");
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/tariffs?stationId=${stationId}&lat=${lat}&lng=${lng}`,
        );
        if (res.ok) {
          const data = await res.json();
          setTariffs(data.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [stationId, lat, lng]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] py-2">
        <div className="w-3 h-3 border border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (tariffs.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
          {t("title")}
        </p>
        {usageCost ? (
          // OCM has free-text price info — show it directly
          <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5">
            <Info size={13} className="shrink-0 mt-0.5 text-[var(--primary)]" />
            <p className="text-xs text-[var(--text-base)]">{usageCost}</p>
          </div>
        ) : (
          // No price data at all — link to operator
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5">
            <p className="text-xs text-[var(--text-muted)]">{t("no_data")}</p>
            {operatorUrl ? (
              <a
                href={operatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline shrink-0 ml-3"
              >
                {t("check_operator")}
                <ExternalLink size={11} />
              </a>
            ) : (
              <a
                href={`https://www.goingelectric.de/stromtankstellen/?q=${encodeURIComponent(`${lat},${lng}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline shrink-0 ml-3"
              >
                {t("check_goingelectric")}
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  const sorted = [...tariffs].sort(
    (a, b) => (a.pricePerKwh ?? a.price ?? 999) - (b.pricePerKwh ?? b.price ?? 999),
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
        {t("title")}
      </p>
      {sorted.map((tariff, i) => (
        <div
          key={tariff.id}
          className={`rounded-xl border p-3 ${
            i === 0
              ? "border-[var(--primary)] bg-[var(--primary-light-soft)]"
              : "border-[var(--border)] bg-[var(--bg-elevated)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {i === 0 && (
                <TrendingDown size={12} className="text-[var(--primary)]" />
              )}
              <span className="text-xs font-semibold text-[var(--text-base)]">
                {tariff.name}
              </span>
              {i === 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white font-bold">
                  {t("cheapest")}
                </span>
              )}
            </div>
            {tariff.pricePerKwh != null && tariff.pricePerKwh > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--text-base)]">
                <Zap size={11} className="text-[var(--primary)]" />
                {tariff.pricePerKwh.toFixed(2)} €/{t("kwh_price")}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {tariff.pricePerMinute != null && tariff.pricePerMinute > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Clock size={9} />
                {tariff.pricePerMinute.toFixed(2)} €/{t("minute_price")}
              </span>
            )}
            {tariff.baseFee != null && tariff.baseFee > 0 && (
              <span className="text-[10px] text-[var(--text-muted)]">
                {t("base_fee")}: {tariff.baseFee.toFixed(2)} €
              </span>
            )}
            {tariff.blockingFee != null && tariff.blockingFee > 0 && (
              <span className="text-[10px] text-[var(--text-muted)]">
                {t("blocking_fee")}: {tariff.blockingFee.toFixed(2)} €
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
