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

/**
 * Returns the URL only when it uses http: or https: protocol.
 * Rejects javascript:, data:, and other potentially harmful URIs.
 * Falls back to the provided fallback string.
 */
function safeExternalUrl(url: string | null | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    const { protocol } = new URL(url);
    if (protocol === "https:" || protocol === "http:") return url;
  } catch {
    // malformed URL — fall through to fallback
  }
  return fallback;
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
            href={safeExternalUrl(
              station.OperatorInfo?.WebsiteURL,
              `https://www.goingelectric.de/stromtankstellen/?q=${encodeURIComponent(station.AddressInfo.Title)}`,
            )}
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
  const [hidden, setHidden] = useState(false);
  const [visible, setVisible] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
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

  if (hidden || !userLocation || nearby.length === 0 || isNavActive) {
    // Show a small re-open button when dismissed
    if (hidden && !isNavActive && nearby.length > 0) {
      return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[595]">
          <button
            type="button"
            onClick={() => setHidden(false)}
            className="flex items-center gap-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1.5 shadow-xl text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:border-green-400 transition-colors"
          >
            <Tag size={11} className="text-green-600 dark:text-green-400" />
            Livefeed ({nearby.length})
          </button>
        </div>
      );
    }
    return null;
  }

  const safeIdx = Math.min(activeIdx, nearby.length - 1);
  const VISIBLE_COUNT = 5;

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 30) return;
    if (dx < 0) setActiveIdx((c) => Math.min(c + 1, nearby.length - 1));
    else setActiveIdx((c) => Math.max(c - 1, 0));
  }

  // Indices visible around the active card (active ± 2)
  const visibleIndices = Array.from({ length: Math.min(VISIBLE_COUNT, nearby.length) }, (_, i) => {
    const offset = i - Math.floor(VISIBLE_COUNT / 2); // -2, -1, 0, 1, 2
    return Math.max(0, Math.min(nearby.length - 1, safeIdx + offset));
  }).filter((v, i, a) => a.indexOf(v) === i); // deduplicate at bounds

  return (
    <>
      {/* ─── Toggle pill (always shown, top-right of the feed area) ─────────── */}
      <div className="absolute bottom-20 right-4 md:bottom-24 z-[596]">
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex items-center gap-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-full px-2.5 py-1.5 shadow-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:border-green-400 transition-colors"
          title={visible ? "Livefeed ausblenden" : "Livefeed einblenden"}
        >
          <Tag size={10} className="text-green-600 dark:text-green-400 shrink-0" />
          {visible ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
        </button>
      </div>

      {visible && (
        <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-[595] pointer-events-none select-none"
          style={{ width: "min(96vw, 920px)" }}>
          <div className="pointer-events-auto">

            {/* ── Header bar ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-t-2xl px-3 py-2 shadow-xl">
              <Tag size={12} className="text-green-600 dark:text-green-400 shrink-0" />
              <EvStationIcon size={13} className="text-green-600 dark:text-green-400 shrink-0" />
              <span className="flex-1 text-[11px] font-bold text-zinc-700 dark:text-zinc-200 truncate">
                Günstigste Ladepunkte im Umkreis · {nearby.length} Stationen
              </span>
              <button
                type="button"
                onClick={() => setHidden(true)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-600"
                aria-label="Schließen"
              >
                <X size={12} />
              </button>
            </div>

            {/* ── Card-deck body ──────────────────────────────────────────────── */}
            <div
              className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-t-0 border-zinc-200 dark:border-zinc-700 rounded-b-2xl shadow-xl overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Card row: 5 cards visible, deck-peek on sides */}
              <div className="flex items-stretch gap-2 px-3 py-3 overflow-hidden relative">
                {/* Ghost "deck" cards peeking behind left edge */}
                {safeIdx > 0 && (
                  <div className="absolute left-1 top-3 bottom-3 w-3 rounded-l-xl bg-gradient-to-r from-zinc-200/60 dark:from-zinc-700/60 to-transparent pointer-events-none z-10" />
                )}
                {/* Ghost "deck" cards peeking behind right edge */}
                {safeIdx < nearby.length - 1 && (
                  <div className="absolute right-1 top-3 bottom-3 w-3 rounded-r-xl bg-gradient-to-l from-zinc-200/60 dark:from-zinc-700/60 to-transparent pointer-events-none z-10" />
                )}

                {/* Mobile: single card with depth cards behind */}
                <div className="md:hidden relative w-full" style={{ minHeight: 80 }}>
                  {/* Stacked "depth" cards (visual only) */}
                  {[2, 1].map((depth) => {
                    const depthIdx = safeIdx + depth;
                    if (depthIdx >= nearby.length) return null;
                    return (
                      <div
                        key={depthIdx}
                        className="absolute inset-0 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                        style={{
                          transform: `translateY(${depth * 4}px) scale(${1 - depth * 0.03})`,
                          zIndex: 10 - depth,
                          opacity: 1 - depth * 0.25,
                        }}
                      />
                    );
                  })}
                  {/* Active card */}
                  <div className="relative z-20 transition-transform duration-300">
                    <StationCard {...nearby[safeIdx]} />
                  </div>
                </div>

                {/* Desktop: 5 cards side-by-side with depth effect */}
                {visibleIndices.map((cardIdx, pos) => {
                  const isActive = cardIdx === safeIdx;
                  const distFromActive = Math.abs(pos - visibleIndices.indexOf(safeIdx));
                  return (
                    <button
                      key={cardIdx}
                      type="button"
                      onClick={() => setActiveIdx(cardIdx)}
                      className={`hidden md:block flex-1 min-w-0 text-left transition-all duration-300 rounded-xl
                        ${isActive
                          ? "ring-2 ring-green-400 dark:ring-green-500 scale-105 shadow-lg z-20"
                          : "opacity-75 hover:opacity-90 hover:scale-102 z-10"
                        }`}
                      style={{
                        transform: isActive
                          ? "scale(1.04) translateY(-2px)"
                          : `scale(${1 - distFromActive * 0.02}) translateY(${distFromActive * 2}px)`,
                        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                        filter: distFromActive > 1 ? `blur(${(distFromActive - 1) * 0.3}px)` : "none",
                      }}
                    >
                      <StationCard {...nearby[cardIdx]} />
                    </button>
                  );
                })}
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveIdx((c) => Math.max(c - 1, 0))}
                  disabled={safeIdx === 0}
                  className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 disabled:opacity-30 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label="Vorherige Station"
                >
                  <ChevronLeft size={14} />
                </button>

                {/* Dot indicators */}
                <div className="flex gap-1 items-center">
                  {nearby.slice(0, Math.min(nearby.length, 12)).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveIdx(i)}
                      className={`rounded-full transition-all duration-200 ${
                        i === safeIdx
                          ? "w-4 h-2 bg-green-500"
                          : Math.abs(i - safeIdx) <= 2
                          ? "w-2 h-2 bg-zinc-300 dark:bg-zinc-600"
                          : "w-1.5 h-1.5 bg-zinc-200 dark:bg-zinc-700"
                      }`}
                      aria-label={`Station ${i + 1}`}
                    />
                  ))}
                  {nearby.length > 12 && (
                    <span className="text-[9px] text-zinc-400 ml-1">+{nearby.length - 12}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveIdx((c) => Math.min(c + 1, nearby.length - 1))}
                  disabled={safeIdx === nearby.length - 1}
                  className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 disabled:opacity-30 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label="Nächste Station"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
