"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { StationMap } from "./StationMap";
import type { MapStyle } from "./StationMap";
import { StationFilters } from "./StationFilters";
import { StationSearch } from "./StationSearch";
import type { StationFiltersState } from "./StationFilters";
import type { OCMStation } from "@/app/api/stations/route";
import {
  Zap, MapPin, ChevronRight, Wifi, WifiOff, HelpCircle,
  Navigation, Layers, Target, BarChart2, ChevronDown, ChevronUp,
} from "lucide-react";

// â”€â”€â”€ Station feed helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusDot({ station }: { station: OCMStation }) {
  const isOk = station.StatusType?.IsOperational;
  const hasStatus = !!station.StatusType;
  if (isOk) return <Wifi size={11} className="text-green-500 shrink-0" />;
  if (hasStatus) return <WifiOff size={11} className="text-red-500 shrink-0" />;
  return <HelpCircle size={11} className="text-zinc-400 shrink-0" />;
}

function PowerBadge({ connections }: { connections?: OCMStation["Connections"] }) {
  const max = Math.max(0, ...(connections?.map((c) => c.PowerKW ?? 0) ?? []));
  if (max <= 0) return null;
  const color =
    max >= 150
      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      : max >= 22
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${color}`}>
      {max >= 1000 ? `${(max / 1000).toFixed(0)} MW` : `${max} kW`}
    </span>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// â”€â”€â”€ Map style config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MAP_STYLES: Array<{ key: MapStyle; label: string; emoji: string }> = [
  { key: "light", label: "Hell", emoji: "☀️" },
  { key: "dark", label: "Dunkel", emoji: "🌙" },
  { key: "satellite", label: "Satellit", emoji: "🛰️" },
  { key: "standard", label: "Standard", emoji: "🗺️" },
];

// â”€â”€â”€ Panel section component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PanelSection({
  title,
  icon,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string | number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-zinc-500 dark:text-zinc-400 shrink-0">{icon}</span>
        <span className="flex-1 text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">
          {title}
        </span>
        {badge !== undefined && (
          <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        {open ? (
          <ChevronUp size={12} className="text-zinc-400 shrink-0" />
        ) : (
          <ChevronDown size={12} className="text-zinc-400 shrink-0" />
        )}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function StationMapWrapper() {
  const [filters, setFilters] = useState<StationFiltersState>({
    powerLevel: null,
    connectorType: null,
  });
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [visibleStations, setVisibleStations] = useState<OCMStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<OCMStation | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>("light");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setFlyToCenter(loc);
        },
        () => {},
        { timeout: 6000 },
      );
    }
  }, []);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setFlyToCenter([lat, lng]);
    setUserLocation([lat, lng]);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  function handleLocateMe() {
    if (!navigator?.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setFlyToCenter(loc);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000, enableHighAccuracy: true },
    );
  }

  function handleFindNearestHpc() {
    const ref = userLocation ?? [51.1657, 10.4515];
    const hpcStations = visibleStations.filter((s) => {
      const maxPow = Math.max(0, ...(s.Connections?.map((c) => c.PowerKW ?? 0) ?? []));
      return maxPow >= 150 && s.StatusType?.IsOperational;
    });
    if (hpcStations.length === 0) {
      showToast("Keine freie HPC-Station (\u226515kW) in Sichtweite.");
      return;
    }
    const nearest = hpcStations.reduce((best, s) => {
      const d = haversine(ref[0], ref[1], s.AddressInfo.Latitude, s.AddressInfo.Longitude);
      const dBest = haversine(ref[0], ref[1], best.AddressInfo.Latitude, best.AddressInfo.Longitude);
      return d < dBest ? s : best;
    });
    const maxPow = Math.max(0, ...(nearest.Connections?.map((c) => c.PowerKW ?? 0) ?? []));
    const dist = haversine(
      ref[0], ref[1],
      nearest.AddressInfo.Latitude,
      nearest.AddressInfo.Longitude,
    );
    setFlyToCenter([nearest.AddressInfo.Latitude, nearest.AddressInfo.Longitude]);
    setSelectedStation(nearest);
    showToast(
      `\u26a1 ${nearest.AddressInfo.Title} \u2022 bis ${maxPow}\u202fkW \u2022 ${dist < 1 ? `${Math.round(dist * 1000)}\u202fm` : `${dist.toFixed(1)}\u202fkm`}`,
    );
  }

  // Derived stats
  const stats = {
    available: visibleStations.filter((s) => s.StatusType?.IsOperational).length,
    defect: visibleStations.filter((s) => s.StatusType && !s.StatusType.IsOperational).length,
    unknown: visibleStations.filter((s) => !s.StatusType).length,
    hpc: visibleStations.filter((s) => Math.max(0, ...(s.Connections?.map((c) => c.PowerKW ?? 0) ?? [])) >= 150).length,
    dc: visibleStations.filter((s) => {
      const p = Math.max(0, ...(s.Connections?.map((c) => c.PowerKW ?? 0) ?? []));
      return p >= 22 && p < 150;
    }).length,
    ac: visibleStations.filter((s) => Math.max(0, ...(s.Connections?.map((c) => c.PowerKW ?? 0) ?? [])) < 22).length,
  };

  const POWER_CHIPS = [
    { label: "AC \u226422kW", value: "ac" as const },
    { label: "DC 22\u2013150kW", value: "dc" as const },
    { label: "HPC \u2265150kW", value: "hpc" as const },
  ];
  const CONNECTOR_CHIPS = [
    { label: "Type 2", value: "type2" as const },
    { label: "CCS2", value: "ccs" as const },
    { label: "CHAdeMO", value: "chademo" as const },
    { label: "Tesla", value: "tesla_ccs" as const },
  ];

  return (
    <div className="relative flex-1 flex h-full overflow-hidden">

      {/* â•â•â• LEFT PANEL (full height) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="absolute top-0 left-0 bottom-0 z-[600] w-72 flex flex-col pointer-events-none">
        {/* Scrollable panel container */}
        <div className="pointer-events-auto flex flex-col gap-0 m-3 mr-0 overflow-y-auto rounded-2xl bg-white/97 dark:bg-zinc-900/97 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 shadow-xl max-h-full">

          {/* Search bar */}
          <div className="px-3 pt-3 pb-2">
            <StationSearch onLocationSelect={handleLocationSelect} />
          </div>

          {/* â”€â”€ Quick Filters â”€â”€â”€ */}
          <PanelSection title="Filter" icon={<Zap size={13} />} defaultOpen={true}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {POWER_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        powerLevel: f.powerLevel === chip.value ? null : chip.value,
                      }))
                    }
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
                      filters.powerLevel === chip.value
                        ? "bg-green-600 text-white border-green-600"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-green-500 hover:text-green-600"
                    }`}
                  >
                    &#9889; {chip.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {CONNECTOR_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        connectorType: f.connectorType === chip.value ? null : chip.value,
                      }))
                    }
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
                      filters.connectorType === chip.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-600"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              {(filters.powerLevel || filters.connectorType) && (
                <button
                  type="button"
                  onClick={() => setFilters({ powerLevel: null, connectorType: null })}
                  className="text-[10px] text-red-500 hover:underline"
                >
                  &#10005; Filter zur\u00fccksetzen
                </button>
              )}
              <div className="pt-1">
                <StationFilters filters={filters} onChange={setFilters} />
              </div>
            </div>
          </PanelSection>

          {/* â”€â”€ Live-Statistik â”€â”€â”€ */}
          <PanelSection
            title="Statistik"
            icon={<BarChart2 size={13} />}
            badge={visibleStations.length}
            defaultOpen={true}
          >
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Verf\u00fcgbar", val: stats.available, cls: "text-green-600 dark:text-green-400" },
                { label: "Defekt", val: stats.defect, cls: "text-red-500" },
                { label: "Unbekannt", val: stats.unknown, cls: "text-zinc-400" },
                { label: "HPC \u226515kW", val: stats.hpc, cls: "text-purple-600 dark:text-purple-400" },
                { label: "DC 22\u2013150kW", val: stats.dc, cls: "text-blue-600 dark:text-blue-400" },
                { label: "AC \u226422kW", val: stats.ac, cls: "text-zinc-500" },
              ].map(({ label, val, cls }) => (
                <div
                  key={label}
                  className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl px-3 py-2 text-center"
                >
                  <p className={`text-lg font-black ${cls}`}>{val}</p>
                  <p className="text-[10px] text-zinc-400 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </PanelSection>

          {/* â”€â”€ Aktionen â”€â”€â”€ */}
          <PanelSection title="Aktionen" icon={<Target size={13} />} defaultOpen={true}>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={locating}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-60"
              >
                <Navigation size={13} className={locating ? "animate-spin text-blue-500" : ""} />
                {locating ? "Wird geortet\u2026" : "Meinen Standort finden"}
              </button>
              <button
                type="button"
                onClick={handleFindNearestHpc}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                <Target size={13} />
                N\u00e4chste HPC-Schnellladung finden
              </button>
            </div>
          </PanelSection>

          {/* â”€â”€ Stationsliste â”€â”€â”€ */}
          <PanelSection
            title="Stationen"
            icon={<MapPin size={13} />}
            badge={visibleStations.length}
          >
            {visibleStations.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-2">Keine Stationen geladen.</p>
            ) : (
              <div className="space-y-0 -mx-3">
                {visibleStations.slice(0, 40).map((s) => (
                  <button
                    key={s.ID}
                    type="button"
                    onClick={() => {
                      setSelectedStation(s);
                      setFlyToCenter([s.AddressInfo.Latitude, s.AddressInfo.Longitude]);
                    }}
                    className={`w-full flex items-start gap-2 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0 text-left ${
                      selectedStation?.ID === s.ID ? "bg-green-50 dark:bg-green-900/20" : ""
                    }`}
                  >
                    <StatusDot station={s} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                        {s.AddressInfo.Title}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">{s.AddressInfo.Town}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <PowerBadge connections={s.Connections} />
                      <ChevronRight size={10} className="text-zinc-300" />
                    </div>
                  </button>
                ))}
                {visibleStations.length > 40 && (
                  <p className="text-[10px] text-zinc-400 text-center py-2">
                    + {visibleStations.length - 40} weitere Stationen im Bereich
                  </p>
                )}
              </div>
            )}
          </PanelSection>

          {/* â”€â”€ Kartenstil â”€â”€â”€ */}
          <PanelSection title="Kartenstil" icon={<Layers size={13} />}>
            <div className="grid grid-cols-2 gap-1.5">
              {MAP_STYLES.map((style) => (
                <button
                  key={style.key}
                  type="button"
                  onClick={() => { setMapStyle(style.key); setShowStylePicker(false); }}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mapStyle === style.key
                      ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700"
                      : "border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400"
                  }`}
                >
                  <span>{style.emoji}</span>
                  {style.label}
                </button>
              ))}
            </div>
          </PanelSection>

          {/* Spacer to bottom */}
          <div className="flex-1 min-h-4" />
        </div>
      </div>

      {/* â•â•â• HPC Toast â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {toast && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[600] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-fade-in pointer-events-none">
          <Zap size={12} className="text-yellow-400 dark:text-yellow-600 shrink-0" />
          {toast}
        </div>
      )}

      {/* â•â•â• Style picker legacy (kept for top-right if needed) â•â•â•â•â•â•â•â•â•â•â• */}
      {showStylePicker && (
        <div
          className="fixed inset-0 z-[590]"
          onClick={() => setShowStylePicker(false)}
        />
      )}

      {/* â•â•â• MAP â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <StationMap
        defaultCenter={[51.1657, 10.4515]}
        filters={filters}
        flyToCenter={flyToCenter}
        userLocation={userLocation}
        mapStyle={mapStyle}
        onStationsChange={setVisibleStations}
        externalSelectedStation={selectedStation}
        onExternalSelectClear={() => setSelectedStation(null)}
      />
    </div>
  );
}
