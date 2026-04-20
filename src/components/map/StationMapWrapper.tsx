"use client";

import type * as GeoJSON from "geojson";
import { useState, useCallback, useEffect, useRef } from "react";
import { StationMapGL } from "./StationMapGL";
import type { MapStyle } from "./StationMapGL";
import { StationFilters } from "./StationFilters";
import { StationSearch } from "./StationSearch";
import { NavigationWizard } from "./NavigationWizard";
import type { NavRoutePreset } from "./NavigationWizard";
import type { StationFiltersState } from "./StationFilters";
import type { OCMStation } from "@/app/api/stations/route";
import type { PlannedChargingStop } from "@/lib/charging-stops";
import { NewsfeedBanner } from "./NewsfeedBanner";
import { EvStationIcon } from "./EvStationIcon";
import { MobileSheet } from "@/components/ui/MobileSheet";
import {
  Zap, ChevronRight, Wifi, WifiOff, HelpCircle,
  Navigation as NavIcon, Layers, Target, BarChart2, ChevronDown, ChevronUp,
  Download, Thermometer, Box, Clock, X, SlidersHorizontal,
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
  { key: "light",    label: "Hell",     emoji: "\u2600\uFE0F" },
  { key: "dark",     label: "Dunkel",   emoji: "\uD83C\uDF19" },
  { key: "bright",   label: "Farbig",   emoji: "\uD83D\uDDFA\uFE0F" },
  { key: "standard", label: "Standard", emoji: "\uD83C\uDFD9\uFE0F" },
];

const BNETZA_URL =
  "https://www.bundesnetzagentur.de/SharedDocs/Downloads/DE/Sachgebiete/Energie/Unternehmen_Institutionen/E_Mobilitaet/Ladesaeulenregister.xlsx?__blob=publicationFile";

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

// ─── Map preferences (persisted to localStorage) ──────────────────────────

export interface MapPrefs {
  mapStyle: MapStyle;
  powerLevel: "all" | "ac" | "dc" | "hpc" | null;
  connectorType: string | null;
  showHeatmap: boolean;
  show3D: boolean;
  showLiveFeed: boolean;
}

const MAP_PREFS_KEY = "lk-map-prefs";

function loadMapPrefs(): MapPrefs {
  if (typeof window === "undefined") return defaultMapPrefs();
  try {
    const raw = localStorage.getItem(MAP_PREFS_KEY);
    if (raw) return { ...defaultMapPrefs(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultMapPrefs();
}

function defaultMapPrefs(): MapPrefs {
  return {
    mapStyle: "light",
    powerLevel: null,
    connectorType: null,
    showHeatmap: false,
    show3D: false,
    showLiveFeed: true,
  };
}

export function saveMapPrefs(prefs: Partial<MapPrefs>) {
  if (typeof window === "undefined") return;
  try {
    const current = loadMapPrefs();
    localStorage.setItem(MAP_PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch { /* ignore */ }
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function StationMapWrapper() {
  const prefs = loadMapPrefs();
  // Validate stored values against allowed union types
  const safePower = (["ac", "dc", "hpc", null] as const).includes(prefs.powerLevel as "ac" | "dc" | "hpc" | null)
    ? (prefs.powerLevel as "ac" | "dc" | "hpc" | null) : null;
  const safeConnector = (["type2", "ccs", "chademo", "tesla_ccs", null] as const).includes(
    prefs.connectorType as "type2" | "ccs" | "chademo" | "tesla_ccs" | null)
    ? (prefs.connectorType as "type2" | "ccs" | "chademo" | "tesla_ccs" | null) : null;
  const [filters, setFilters] = useState<StationFiltersState>({
    powerLevel: safePower,
    connectorType: safeConnector,
  });
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [visibleStations, setVisibleStations] = useState<OCMStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<OCMStation | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>(prefs.mapStyle);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [show3D, setShow3D] = useState(prefs.show3D);
  const [showHeatmap, setShowHeatmap] = useState(prefs.showHeatmap);
  const [showLiveFeed] = useState(prefs.showLiveFeed);
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [navPreset, setNavPreset] = useState<NavRoutePreset | null>(null);
  // Read preset from sessionStorage on mount and trigger NavigationWizard via state change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("lk_nav_preset");
      if (raw) {
        sessionStorage.removeItem("lk_nav_preset");
        const parsed = JSON.parse(raw) as NavRoutePreset;
        setNavPreset(parsed);
        // Fly to destination immediately so the user sees the target
        if (parsed.toCoord) {
          setFlyToCenter([parsed.toCoord[0], parsed.toCoord[1]]);
        }
      }
    } catch {
      // ignore malformed preset
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [navPosition, setNavPosition] = useState<[number, number, number] | null>(null);
  const [chargingStops, setChargingStops] = useState<PlannedChargingStop[]>([]);
  const [isNavActive, setIsNavActive] = useState(false);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const locWatchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator?.geolocation) return;
    // Watch position for continuous heading updates (direction arrow on map)
    locWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setFlyToCenter((prev) => prev ?? loc); // only fly on first fix
        if (pos.coords.heading !== null && Number.isFinite(pos.coords.heading)) {
          setUserHeading(pos.coords.heading);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );
    return () => {
      if (locWatchRef.current !== null) navigator.geolocation.clearWatch(locWatchRef.current);
    };
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
    // If watchPosition already has a fix, just fly there immediately
    if (userLocation) {
      setFlyToCenter(userLocation);
      return;
    }
    if (!navigator?.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setFlyToCenter(loc);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          showToast("⛔ Standortzugriff verweigert – bitte in den Browser-Einstellungen erlauben.");
        } else {
          showToast("⚠️ Standort konnte nicht ermittelt werden.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true },
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

  function handleFindNearestFree() {
    const ref = userLocation ?? [51.1657, 10.4515];
    const free = visibleStations.filter((s) => s.StatusType?.IsOperational);
    if (free.length === 0) {
      showToast("Keine verfügbare Station in Sichtweite.");
      return;
    }
    const nearest = free.reduce((best, s) => {
      const d = haversine(ref[0], ref[1], s.AddressInfo.Latitude, s.AddressInfo.Longitude);
      const dBest = haversine(ref[0], ref[1], best.AddressInfo.Latitude, best.AddressInfo.Longitude);
      return d < dBest ? s : best;
    });
    const dist = haversine(ref[0], ref[1], nearest.AddressInfo.Latitude, nearest.AddressInfo.Longitude);
    setFlyToCenter([nearest.AddressInfo.Latitude, nearest.AddressInfo.Longitude]);
    setSelectedStation(nearest);
    showToast(`✅ ${nearest.AddressInfo.Title} • ${dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}`);
  }

  function handleExportCSV() {
    if (visibleStations.length === 0) {
      showToast("Keine Stationen zum Exportieren.");
      return;
    }
    const header = ["Name", "Ort", "PLZ", "Breitengrad", "Längengrad", "Max kW", "Status", "Betreiber"];
    const rows = visibleStations.map((s) => {
      const maxKw = Math.max(0, ...(s.Connections?.map((c) => c.PowerKW ?? 0) ?? []));
      return [
        `"${(s.AddressInfo.Title ?? "").replace(/"/g, '""')}"`,
        `"${(s.AddressInfo.Town ?? "").replace(/"/g, '""')}"`,
        s.AddressInfo.Postcode ?? "",
        s.AddressInfo.Latitude,
        s.AddressInfo.Longitude,
        maxKw,
        s.StatusType?.IsOperational ? "Verfügbar" : s.StatusType ? "Defekt" : "Unbekannt",
        `"${(s.OperatorInfo?.Title ?? "").replace(/"/g, '""')}"`,
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ladekompass-stationen-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${visibleStations.length} Stationen exportiert.`);
  }

  // Derived stats
  const displayedStations = showOpenOnly
    ? visibleStations.filter((s) => s.OpeningTimes?.IsOpen247 === true || s.StatusType?.IsOperational)
    : visibleStations;

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
    open247: visibleStations.filter((s) => s.OpeningTimes?.IsOpen247 === true).length,
  };
  const totalPower = stats.hpc + stats.dc + stats.ac || 1;

  const [showPanel, setShowPanel] = useState(true);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

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

      {/* LEFT PANEL toggle FAB when hidden */}
      {!showPanel && (
        <button
          type="button"
          onClick={() => setShowPanel(true)}
          className="hidden md:block absolute top-3 left-3 z-[650] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full p-2.5 shadow-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          title="Panel einblenden"
        >
          <Layers size={18} className="text-zinc-600 dark:text-zinc-300" />
        </button>
      )}

      {/* LEFT PANEL (full height) — desktop only */}
      <div className={`hidden md:flex absolute top-0 left-0 bottom-0 z-[600] w-72 flex-col pointer-events-none transition-transform duration-300 ${showPanel ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Scrollable panel container */}
        <div className="pointer-events-auto flex flex-col gap-0 m-3 mr-0 overflow-y-auto rounded-2xl bg-white/97 dark:bg-zinc-900/97 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 shadow-xl max-h-full">

          {/* Panel header with hide button */}
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
            <span className="flex-1 text-xs font-bold text-zinc-400 uppercase tracking-widest">LadeKompass</span>
            <button
              type="button"
              onClick={() => setShowPanel(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Panel ausblenden"
            >
              <X size={13} />
            </button>
          </div>

          {/* Search bar */}
          <div className="px-3 pt-1 pb-2">
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
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setShowOpenOnly((v) => !v)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors flex items-center gap-1 ${
                    showOpenOnly
                      ? "bg-amber-500 text-white border-amber-500"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-amber-400 hover:text-amber-600"
                  }`}
                >
                  <Clock size={9} />
                  Jetzt geöffnet
                </button>
              </div>
              {(filters.powerLevel || filters.connectorType || showOpenOnly) && (
                <button
                  type="button"
                  onClick={() => { setFilters({ powerLevel: null, connectorType: null }); setShowOpenOnly(false); }}
                  className="text-[10px] text-red-500 hover:underline"
                >
                  &#10005; Filter zurücksetzen
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
                { label: "24/7 geöffnet", val: stats.open247, cls: "text-amber-600 dark:text-amber-400" },
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
            {/* Mini bar chart: HPC / DC / AC ratio */}
            {visibleStations.length > 0 && (
              <div className="mt-2 space-y-1">
                {[
                  { label: "HPC", val: stats.hpc, color: "bg-purple-500" },
                  { label: "DC",  val: stats.dc,  color: "bg-blue-500" },
                  { label: "AC",  val: stats.ac,  color: "bg-zinc-400" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[9px] w-6 text-right font-bold text-zinc-400">{label}</span>
                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.round((val / totalPower) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] w-6 text-zinc-400">{val}</span>
                  </div>
                ))}
              </div>
            )}
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
                <NavIcon size={13} className={locating ? "animate-spin text-blue-500" : ""} />
                {locating ? "Wird geortet\u2026" : "Meinen Standort finden"}
              </button>
              <button
                type="button"
                onClick={handleFindNearestHpc}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                <Target size={13} />
                Nächste HPC-Schnellladung finden
              </button>
              <button
                type="button"
                onClick={handleFindNearestFree}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <Target size={13} className="text-green-500" />
                Nächste freie Station finden
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Download size={13} />
                Stationen als CSV exportieren
              </button>
              <a
                href={BNETZA_URL}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-orange-400 hover:text-orange-600 transition-colors"
              >
                <Download size={13} className="text-orange-500" />
                BNetzA Ladesäulenregister (XLSX)
              </a>
            </div>
          </PanelSection>

          {/* ── Stationsliste ─── */}
          <PanelSection
            title="Stationen"
            icon={<EvStationIcon size={13} />}
            badge={displayedStations.length}
          >
            {displayedStations.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-2">Keine Stationen geladen.</p>
            ) : (
              <div className="space-y-0 -mx-3">
                {displayedStations.slice(0, 40).map((s) => (
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
                      <div className="flex items-center gap-1.5">
                        <EvStationIcon size={13} className={
                          s.StatusType?.IsOperational === true ? "text-green-600 dark:text-green-400" :
                          s.StatusType?.IsOperational === false ? "text-red-500" : "text-zinc-400"
                        } />
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                          {s.AddressInfo.Title}
                        </p>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">{s.AddressInfo.Town}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <PowerBadge connections={s.Connections} />
                      <ChevronRight size={10} className="text-zinc-300" />
                    </div>
                  </button>
                ))}
                {displayedStations.length > 40 && (
                  <p className="text-[10px] text-zinc-400 text-center py-2">
                    + {displayedStations.length - 40} weitere Stationen im Bereich
                  </p>
                )}
              </div>
            )}
          </PanelSection>

          {/* Kartenoptionen */}
          <PanelSection title="Kartenoptionen" icon={<Box size={13} />}>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => { setShow3D((v) => { const n = !v; saveMapPrefs({ show3D: n }); return n; }); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                  show3D
                    ? "bg-sky-50 dark:bg-sky-900/30 border-sky-400 text-sky-700 dark:text-sky-300"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-sky-400 hover:text-sky-600"
                }`}
              >
                <Box size={12} />
                3D-Gebäudeansicht
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  show3D ? "bg-sky-200 text-sky-800" : "bg-zinc-100 text-zinc-400"
                }`}>{show3D ? "AN" : "AUS"}</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowHeatmap((v) => { const n = !v; saveMapPrefs({ showHeatmap: n }); return n; }); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                  showHeatmap
                    ? "bg-orange-50 dark:bg-orange-900/30 border-orange-400 text-orange-700 dark:text-orange-300"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-orange-400 hover:text-orange-600"
                }`}
                title="Zeigt eine Dichteverteilung aller Ladestationen als Heatmap an"
              >
                <Thermometer size={12} />
                Heatmap-Ansicht
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  showHeatmap ? "bg-orange-200 text-orange-800" : "bg-zinc-100 text-zinc-400"
                }`}>{showHeatmap ? "AN" : "AUS"}</span>
              </button>
              {showHeatmap && (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug px-1">
                  Zeigt die Dichte aller Ladestationen in Deutschland. Je wärmer die Farbe (gelb/rot), desto mehr Stationen sind in diesem Gebiet konzentriert — ideal zur Erkennung von Versorgungslücken.
                </p>
              )}
            </div>
          </PanelSection>

          {/* ── Kartenstil ─── */}
          <PanelSection title="Kartenstil" icon={<Layers size={13} />}>
            <div className="grid grid-cols-2 gap-1.5">
              {MAP_STYLES.map((style) => (
                <button
                  key={style.key}
                  type="button"
                  onClick={() => { setMapStyle(style.key); setShowStylePicker(false); saveMapPrefs({ mapStyle: style.key }); }}
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

      {/* ═══ Mobile FAB – Filter & Stationen (mobile only) ════════════════ */}
      <div className="md:hidden absolute bottom-20 left-4 z-[620]">
        <button
          type="button"
          onClick={() => setMobilePanelOpen(true)}
          className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full p-3 shadow-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          title="Filter &amp; Stationen"
          aria-label="Filter und Stationen öffnen"
        >
          <SlidersHorizontal size={18} className="text-zinc-600 dark:text-zinc-300" />
          {(filters.powerLevel || filters.connectorType || showOpenOnly) && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
          )}
        </button>
      </div>

      {/* Mobile Sheet – Filter & Stationen ──────────────────────────────── */}
      <MobileSheet
        open={mobilePanelOpen}
        onClose={() => setMobilePanelOpen(false)}
        title="Karte & Filter"
        height="full"
      >
        <div className="space-y-4 py-1">
          <StationSearch onLocationSelect={(lat, lng) => { handleLocationSelect(lat, lng); setMobilePanelOpen(false); }} />

          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Ladeleistung</p>
            <div className="flex flex-wrap gap-1.5">
              {POWER_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, powerLevel: f.powerLevel === chip.value ? null : chip.value }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    filters.powerLevel === chip.value
                      ? "bg-green-600 text-white border-green-600"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  ⚡ {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Steckertyp</p>
            <div className="flex flex-wrap gap-1.5">
              {CONNECTOR_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, connectorType: f.connectorType === chip.value ? null : chip.value }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    filters.connectorType === chip.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowOpenOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                showOpenOnly ? "bg-amber-500 text-white border-amber-500" : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
              }`}
            >
              <Clock size={11} /> Jetzt geöffnet
            </button>
            {(filters.powerLevel || filters.connectorType || showOpenOnly) && (
              <button
                type="button"
                onClick={() => { setFilters({ powerLevel: null, connectorType: null }); setShowOpenOnly(false); }}
                className="flex items-center gap-1 text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-full"
              >
                <X size={11} /> Zurücksetzen
              </button>
            )}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Schnellaktionen</p>
            <button type="button" onClick={() => { handleLocateMe(); setMobilePanelOpen(false); }} disabled={locating} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:border-blue-400 disabled:opacity-60 transition-colors">
              <NavIcon size={16} className={locating ? "animate-spin text-blue-500" : ""} />
              {locating ? "Wird geortet…" : "Meinen Standort"}
            </button>
            <button type="button" onClick={() => { handleFindNearestHpc(); setMobilePanelOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:border-purple-400 transition-colors">
              <Target size={16} /> Nächste HPC-Station
            </button>
            <button type="button" onClick={() => { handleFindNearestFree(); setMobilePanelOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:border-green-400 transition-colors">
              <Target size={16} className="text-green-500" /> Nächste freie Station
            </button>
          </div>

          {displayedStations.length > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Stationen ({displayedStations.length})</p>
              <div className="-mx-4">
                {displayedStations.slice(0, 30).map((s) => (
                  <button
                    key={s.ID}
                    type="button"
                    onClick={() => { setSelectedStation(s); setFlyToCenter([s.AddressInfo.Latitude, s.AddressInfo.Longitude]); setMobilePanelOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 last:border-0 text-left transition-colors"
                  >
                    <StatusDot station={s} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{s.AddressInfo.Title}</p>
                      <p className="text-xs text-zinc-400 truncate">{s.AddressInfo.Town}</p>
                    </div>
                    <PowerBadge connections={s.Connections} />
                    <ChevronRight size={12} className="text-zinc-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </MobileSheet>

      {/* â•â•â• HPC Toast â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {toast && (
        <div className="absolute bottom-28 md:bottom-20 left-1/2 -translate-x-1/2 z-[600] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-fade-in pointer-events-none">
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
      {/* Navigation Wizard - right floating panel */}
      <NavigationWizard
        onRoute={(geoJSON) => setRouteGeoJSON(geoJSON)}
        onClear={() => { setRouteGeoJSON(null); setNavPosition(null); setChargingStops([]); setIsNavActive(false); }}
        preset={navPreset}
        onPositionUpdate={(pos) => setNavPosition(pos)}
        onNavStop={() => { setNavPosition(null); setIsNavActive(false); }}
        onChargingStops={(stops) => setChargingStops(stops)}
        onNavActiveChange={(active) => setIsNavActive(active)}
      />

      {/* Newsfeed Banner - cheapest stations within 50km */}
      {showLiveFeed && (
        <NewsfeedBanner
          stations={visibleStations}
          userLocation={userLocation}
          isNavActive={isNavActive}
        />
      )}

      <StationMapGL
        defaultCenter={[51.1657, 10.4515]}
        filters={filters}
        flyToCenter={flyToCenter}
        userLocation={userLocation}
        mapStyle={mapStyle}
        show3D={show3D}
        showHeatmap={showHeatmap}
        onStationsChange={setVisibleStations}
        onStationSelect={(s) => setSelectedStation(s)}
        selectedStation={selectedStation}
        routeGeoJSON={routeGeoJSON}
        navPosition={navPosition}
        userHeading={userHeading}
        chargingStops={chargingStops}
        onNavigateTo={(lat, lng, label) => {
          // Always get fresh GPS position for most accurate start point
          const buildPreset = (fromLat: number, fromLng: number) => {
            setNavPreset({
              fromLabel: "Aktueller Standort",
              toLabel: label,
              fromCoord: [fromLat, fromLng],
              toCoord: [lat, lng],
            });
            setFlyToCenter([fromLat, fromLng]);
          };
          if (navigator?.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => buildPreset(pos.coords.latitude, pos.coords.longitude),
              ()    => buildPreset(...(userLocation ?? [51.1657, 10.4515])),
              { timeout: 5000, enableHighAccuracy: true },
            );
          } else {
            buildPreset(...(userLocation ?? [51.1657, 10.4515]));
          }
        }}
      />
    </div>
  );
}
