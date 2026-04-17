"use client";

import { useState, useMemo } from "react";
import { X, Tag, Zap, Wifi, WifiOff, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
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
  // Match patterns like "0,30 €/kWh", "0.30 EUR/kWh", "30 Cent/kWh"
  const m = text.match(/([0-9]+[.,][0-9]+)\s*(?:€|EUR|euro)?\/kWh/i);
  if (m) {
    const n = parseFloat(m[1].replace(",", "."));
    return isNaN(n) ? null : n;
  }
  // Kostenlos / gratis / frei
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

export function NewsfeedBanner({ stations, userLocation, isNavActive }: NewsfeedBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
        // Free first, then by price (lowest), then defect/unknown, then by distance
        const aFree = a.station.StatusType?.IsOperational === true ? 0 : 2;
        const bFree = b.station.StatusType?.IsOperational === true ? 0 : 2;
        if (aFree !== bFree) return aFree - bFree;
        // Sort by price when both have price info
        if (a.price !== null && b.price !== null) return a.price - b.price;
        if (a.price !== null) return -1;
        if (b.price !== null) return 1;
        return a.distKm - b.distKm;
      })
      .slice(0, 20);
  }, [stations, userLocation]);

  if (dismissed || !userLocation || nearby.length === 0 || isNavActive) return null;

  return (
    <div className="absolute bottom-20 left-3 right-3 z-[595] pointer-events-none">
      <div className="pointer-events-auto">
        {/* Header bar */}
        <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-t-2xl px-3 py-2 shadow-xl">
          <Tag size={13} className="text-green-600 dark:text-green-400 shrink-0" />
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

        {/* Scrollable cards */}
        {!collapsed && (
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-t-0 border-zinc-200 dark:border-zinc-700 rounded-b-2xl shadow-xl overflow-x-auto">
            <div className="flex gap-2 px-3 py-2.5" style={{ width: "max-content" }}>
              {nearby.map(({ station, distKm, price, maxKw }) => (
                <div
                  key={station.ID}
                  className="flex flex-col gap-1.5 w-44 shrink-0 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl px-3 py-2.5 border border-zinc-100 dark:border-zinc-700 hover:border-green-400 dark:hover:border-green-600 transition-colors cursor-pointer"
                >
                  {/* Station name */}
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-tight line-clamp-2">
                    {station.AddressInfo.Title}
                  </p>

                  {/* Status + distance row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StatusBadge station={station} />
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
                    </span>
                  </div>

                  {/* Power + price row */}
                  <div className="flex items-center gap-1.5">
                    {maxKw > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        <Zap size={9} />
                        {maxKw} kW
                      </span>
                    )}
                    {price === 0 ? (
                      <span className="text-[10px] font-bold text-green-600 dark:text-green-400 ml-auto">
                        Kostenlos
                      </span>
                    ) : price !== null ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 ml-auto">
                        {price.toFixed(2)} €/kWh
                      </span>
                    ) : station.UsageCost ? (
                      <span className="text-[9px] text-zinc-400 truncate ml-auto max-w-[80px]" title={station.UsageCost}>
                        {station.UsageCost.slice(0, 18)}
                        {station.UsageCost.length > 18 ? "…" : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
