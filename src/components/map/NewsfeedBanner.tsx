"use client";

import { useState, useMemo, useRef } from "react";
import { X, Tag, Zap, Wifi, WifiOff, HelpCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { EvStationIcon } from "./EvStationIcon";
import type { OCMStation } from "@/app/api/stations/route";

interface NewsfeedBannerProps {
  stations: OCMStation[];
  userLocation: [number, number] | null;
  isNavActive?: boolean;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Parse a rough price from OCM UsageCost string, returns €/kWh or null */
function parsePrice(text?: string | null): number | null {
  if (!text) return null;
  const m = text.match(/([0-9]+[.,][0-9]+)\s*(?:€|EUR|euro)?\/kWh/i);
  if (m) {
    const n = parseFloat(m[1].replace(",", "."));
    return isNaN(n) ? null : n;
  }
  if (/kostenlos|gratis|frei|free|0\.0|0,0/i.test(text)) return 0;
  return null;
}

function StatusBadge({ station }: { station: OCMStation }) {
  const isOp = station.StatusType?.IsOperational;
  const hasStatus = !!station.StatusType;
  if (isOp === true)
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 shrink-0">
        <Wifi size={9} /> Frei
      </span>
    );
  if (isOp === false)
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 shrink-0">
        <WifiOff size={9} /> Defekt
      </span>
    );
  if (hasStatus)
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 shrink-0">
        <WifiOff size={9} /> Belegt
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
      <HelpCircle size={9} /> Unbekannt
    </span>
  );
}

function StationCard({ station, distKm, price, maxKw }: { station: OCMStation; distKm: number; price: number | null; maxKw: number }) {
  return (
    <div className="flex flex-col gap-1.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl px-3 py-2.5 border border-zinc-100 dark:border-zinc-700 hover:border-green-400 dark:hover:border-green-600 transition-colors cursor-pointer">
      <div className="flex items-start gap-1.5">
        <EvStationIcon
          size={14}
          className={
            station.StatusType?.IsOperational === true
              ? "text-green-600 dark:text-green-400 shrink-0 mt-0.5"
              : station.StatusType?.IsOperational === false
              ? "text-red-500 shrink-0 mt-0.5"
              : "text-zinc-400 shrink-0 mt-0.5"
          }
        />
        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-tight line-clamp-2">
          {station.AddressInfo.Title}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <StatusBadge station={station} />
        <span className="text-[10px] text-zinc-400 shrink-0">
          {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {maxKw > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-600 dark:text-green-400">
            <Zap size={9} />
            {maxKw} kW
          </span>
        )}
        {price === 0 ? (
          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 ml-auto">Kostenlos</span>
        ) : price !== null ? (
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 ml-auto">
            {price.toFixed(2)} €/kWh
          </span>
        ) : station.UsageCost ? (
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate ml-auto max-w-[90px]" title={station.UsageCost}>
            {station.UsageCost.length > 20 ? station.UsageCost.slice(0, 20) + "…" : station.UsageCost}
          </span>
        ) : (
          <a
            href={station.OperatorInfo?.WebsiteURL ?? `https://www.goingelectric.de/stromtankstellen/?q=${encodeURIComponent(station.AddressInfo.Title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-[9px] font-semibold text-[var(--primary,#16a34a)] hover:underline ml-auto shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            Tarif prüfen ↗
          </a>
        )}
      </div>
    </div>
  );
}

export function NewsfeedBanner({ stations, userLocation, isNavActive }: NewsfeedBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const nearby = useMemo(() => {
    if (!userLocation || stations.length === 0) return [];
    const ref = userLocation;
    return stations
      .map((s) => ({
        station: s,
        distKm: haversineKm(ref[0], ref[1], s.AddressInfo.Latitude, s.AddressInfo.Longitude),
        price: parsePrice(s.UsageCost),
        maxKw: Math.max(0, ...(s.Connections?.map((c) => c.PowerKW ?? 0) ?? [])),
      }))
      .filter((e) => e.distKm <= 50)
      .sort((a, b) => {
        const aFree = a.station.StatusType?.IsOperational === true ? 0 : 2;
        const bFree = b.station.StatusType?.IsOperational === true ? 0 : 2;
        if (aFree !== bFree) return aFree - bFree;
        if (a.price !== null && b.price !== null) return a.price - b.price;
        if (a.price !== null) return -1;
        if (b.price !== null) return 1;
        return a.distKm - b.distKm;
      })
      .slice(0, 20);
  }, [stations, userLocation]);

  if (dismissed || !userLocation || nearby.length === 0 || isNavActive) return null;

  const safeCard = Math.min(currentCard, nearby.length - 1);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 30) return;
    if (dx < 0) setCurrentCard((c) => Math.min(c + 1, nearby.length - 1));
    else setCurrentCard((c) => Math.max(c - 1, 0));
  }

  const header = (
    <div className="flex items-center gap-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-t-2xl px-2.5 py-1.5 shadow-xl">
      <Tag size={11} className="text-green-600 dark:text-green-400 shrink-0" />
      <span className="flex-1 text-[11px] font-bold text-zinc-700 dark:text-zinc-200 truncate">
        Günstig in 50 km
      </span>
      <span className="text-[9px] text-zinc-400 shrink-0">{nearby.length}</span>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400"
      >
        {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400"
        aria-label="Schließen"
      >
        <X size={12} />
      </button>
    </div>
  );

  return (
    <>
      {/* ─── MOBILE version: compact single-card with swipe ─────────────────── */}
      <div className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 z-[595] pointer-events-none w-[min(92vw,280px)]">
        <div className="pointer-events-auto">
          {header}
          {!collapsed && (
            <div
              className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-t-0 border-zinc-200 dark:border-zinc-700 rounded-b-2xl shadow-xl"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="px-2.5 pt-2 pb-1">
                <StationCard {...nearby[safeCard]} />
              </div>
              {/* Navigation controls + dots */}
              <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentCard((c) => Math.max(c - 1, 0))}
                  disabled={safeCard === 0}
                  className="p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 disabled:opacity-30 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label="Vorherige Station"
                >
                  <ChevronLeft size={14} />
                </button>
                {/* Dot indicators */}
                <div className="flex gap-1">
                  {nearby.slice(0, Math.min(nearby.length, 8)).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentCard(i)}
                      className={`rounded-full transition-all ${i === safeCard ? "w-3 h-2 bg-green-500" : "w-2 h-2 bg-zinc-300 dark:bg-zinc-600"}`}
                      aria-label={`Station ${i + 1}`}
                    />
                  ))}
                  {nearby.length > 8 && <span className="text-[9px] text-zinc-400">…</span>}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentCard((c) => Math.min(c + 1, nearby.length - 1))}
                  disabled={safeCard === nearby.length - 1}
                  className="p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 disabled:opacity-30 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label="Nächste Station"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── DESKTOP version: horizontal scroll ─────────────────────────────── */}
      <div className="hidden md:block absolute bottom-20 left-1/2 -translate-x-1/2 z-[595] pointer-events-none w-full max-w-[55vw] min-w-[380px] px-3">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-t-2xl px-3 py-2 shadow-xl">
            <Tag size={13} className="text-green-600 dark:text-green-400 shrink-0" />
            <EvStationIcon size={14} className="text-green-600 dark:text-green-400 shrink-0" />
            <span className="flex-1 text-xs font-bold text-zinc-700 dark:text-zinc-200">
              Günstigste Ladepunkte im Umkreis 50 km
            </span>
            <span className="text-[10px] text-zinc-400">{nearby.length} Stationen</span>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-600"
            >
              {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-600"
              aria-label="Schließen"
            >
              <X size={13} />
            </button>
          </div>
          {!collapsed && (
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-t-0 border-zinc-200 dark:border-zinc-700 rounded-b-2xl shadow-xl overflow-x-auto">
              <div className="flex gap-2.5 px-3 py-3" style={{ width: "max-content" }}>
                {nearby.map(({ station, distKm, price, maxKw }) => (
                  <div key={station.ID} className="w-44 shrink-0">
                    <StationCard station={station} distKm={distKm} price={price} maxKw={maxKw} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
