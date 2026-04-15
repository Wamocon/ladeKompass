"use client";

import { useState, useCallback, useEffect } from "react";
import { StationMap } from "./StationMap";
import { StationFilters } from "./StationFilters";
import { StationSearch } from "./StationSearch";
import type { StationFiltersState } from "./StationFilters";
import type { OCMStation } from "@/app/api/stations/route";
import { Zap, MapPin, ChevronRight, Wifi, WifiOff, HelpCircle } from "lucide-react";

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
  const color = max >= 150 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
    : max >= 22 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${color}`}>
      {max >= 1000 ? `${(max / 1000).toFixed(0)}MW` : `${max}kW`}
    </span>
  );
}

export default function StationMapWrapper() {
  const [filters, setFilters] = useState<StationFiltersState>({
    powerLevel: null,
    connectorType: null,
  });
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [visibleStations, setVisibleStations] = useState<OCMStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<OCMStation | null>(null);
  const [showFeed, setShowFeed] = useState(false);

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

  // Quick power filter chips
  const POWER_CHIPS = [
    { label: "AC ≤22kW", value: "ac" as const },
    { label: "DC 22–150kW", value: "dc" as const },
    { label: "HPC ≥150kW", value: "hpc" as const },
  ];
  const CONNECTOR_CHIPS = [
    { label: "Type 2", value: "type2" as const },
    { label: "CCS2", value: "ccs" as const },
    { label: "CHAdeMO", value: "chademo" as const },
    { label: "Tesla", value: "tesla_ccs" as const },
  ];

  return (
    <div className="relative flex-1 flex h-full overflow-hidden">
      {/* ── Left Wizard Panel (Search + Quick Filters + Feed) ── */}
      <div className="absolute top-3 left-3 z-[600] flex flex-col gap-2 w-72 max-h-[calc(100%-1.5rem)] pointer-events-none">
        {/* Search bar */}
        <div className="pointer-events-auto">
          <StationSearch onLocationSelect={handleLocationSelect} />
        </div>

        {/* Quick-filter chips row */}
        <div className="pointer-events-auto bg-(--bg-surface)/95 backdrop-blur-sm border border-(--border) rounded-xl px-3 py-2 shadow flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {POWER_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    powerLevel: f.powerLevel === chip.value ? null : chip.value,
                  }))
                }
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
                  filters.powerLevel === chip.value
                    ? "bg-(--primary) text-white border-(--primary)"
                    : "border-(--border) text-(--text-muted) hover:border-(--primary) hover:text-(--primary)"
                }`}
              >
                ⚡ {chip.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {CONNECTOR_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    connectorType: f.connectorType === chip.value ? null : chip.value,
                  }))
                }
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
                  filters.connectorType === chip.value
                    ? "bg-(--primary) text-white border-(--primary)"
                    : "border-(--border) text-(--text-muted) hover:border-(--primary) hover:text-(--primary)"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          {(filters.powerLevel || filters.connectorType) && (
            <button
              onClick={() => setFilters({ powerLevel: null, connectorType: null })}
              className="text-[10px] text-(--primary) hover:underline text-left"
            >
              Alle Filter zurücksetzen
            </button>
          )}
        </div>

        {/* Toggle Station Feed */}
        <button
          onClick={() => setShowFeed((v) => !v)}
          className="pointer-events-auto self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-(--bg-surface)/95 backdrop-blur-sm border border-(--border) text-xs font-semibold text-(--text-muted) hover:text-(--primary) hover:border-(--primary) shadow transition-colors"
        >
          <MapPin size={12} />
          {showFeed ? "Feed ausblenden" : `Stationen (${visibleStations.length})`}
        </button>

        {/* Stations Feed Panel */}
        {showFeed && visibleStations.length > 0 && (
          <div className="pointer-events-auto bg-(--bg-surface)/97 backdrop-blur-sm border border-(--border) rounded-2xl shadow-xl overflow-y-auto max-h-80 flex flex-col">
            <div className="px-3 py-2 border-b border-(--border) flex items-center gap-2">
              <Zap size={13} className="text-(--primary)" />
              <span className="text-xs font-bold text-(--text-base)">{visibleStations.length} Stationen im Bereich</span>
            </div>
            {visibleStations.map((s) => (
              <button
                key={s.ID}
                onClick={() => {
                  setSelectedStation(s);
                  setFlyToCenter([s.AddressInfo.Latitude, s.AddressInfo.Longitude]);
                }}
                className={`flex items-start gap-2 px-3 py-2.5 hover:bg-(--bg-elevated) transition-colors border-b border-(--border) last:border-0 text-left ${
                  selectedStation?.ID === s.ID ? "bg-(--primary)/5" : ""
                }`}
              >
                <StatusDot station={s} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-(--text-base) truncate">{s.AddressInfo.Title}</p>
                  <p className="text-[10px] text-(--text-muted) truncate">{s.AddressInfo.Town}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <PowerBadge connections={s.Connections} />
                  <ChevronRight size={10} className="text-(--text-muted)" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Erweiterte Filter (rechts oben) */}
      <div className="absolute top-3 right-3 z-[600]">
        <StationFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Map */}
      <StationMap
        defaultCenter={[51.1657, 10.4515]}
        filters={filters}
        flyToCenter={flyToCenter}
        userLocation={userLocation}
        onStationsChange={setVisibleStations}
        externalSelectedStation={selectedStation}
        onExternalSelectClear={() => setSelectedStation(null)}
      />
    </div>
  );
}
