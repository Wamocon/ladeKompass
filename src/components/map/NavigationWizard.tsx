"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Navigation, Loader2, X, MapPin, Search,
  ChevronDown, ChevronUp, Minus, Play, Square, AlertCircle,
  BatteryCharging, Zap, CheckCircle, LocateFixed, Clock,
} from "lucide-react";
import {
  planChargingStops,
  type PlannedChargingStop,
  type ChargingStopPlan,
} from "@/lib/charging-stops";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export interface OsrmStep {
  maneuver: {
    type: string;
    modifier?: string;
    location?: [number, number];
  };
  name: string;
  distance: number;
  duration: number;
  /** OSRM intersection data — first element has lane info */
  intersections?: Array<{
    location: [number, number];
    bearings: number[];
    lanes?: Array<{
      indications: string[];  // ["left"], ["straight"], ["right"], ["straight", "right"] etc.
      valid: boolean;         // true = recommended lane
    }>;
  }>;
}

export interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: GeoJSON.LineString;
  steps: OsrmStep[];
}

export interface NavRoutePreset {
  fromLabel: string;
  toLabel: string;
  fromCoord: [number, number];
  toCoord: [number, number];
}

interface NavigationWizardProps {
  onRoute: (geoJSON: GeoJSON.FeatureCollection) => void;
  onClear: () => void;
  preset?: NavRoutePreset | null;
  onPositionUpdate?: (pos: [number, number, number]) => void;
  onNavStop?: () => void;
  /** Called whenever charging stops are planned or cleared */
  onChargingStops?: (stops: PlannedChargingStop[]) => void;
  /** Called when navigation active state changes */
  onNavActiveChange?: (active: boolean) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function fmtTime(s: number) {
  const min = Math.round(s / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}m`;
}

function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * SVG-based maneuver arrow — renders clean navigation direction arrows
 * similar to professional navigation apps (no PowerPoint-style icons).
 */
function ManeuverIcon({ type, modifier, size = 20 }: { type: string; modifier?: string; size?: number }) {
  const s = size;
  const sw = Math.max(2, Math.round(s * 0.16));  // stroke-width scaled to size
  const color = "currentColor";

  if (type === "arrive") {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-green-400 shrink-0" fill="none">
        <circle cx="50" cy="50" r="28" stroke={color} strokeWidth={sw * 1.4}/>
        <circle cx="50" cy="50" r="12" fill={color}/>
      </svg>
    );
  }

  if (type === "roundabout" || type === "rotary") {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-yellow-400 shrink-0" fill="none">
        <path d="M50 18 A32 32 0 1 0 82 50" stroke={color} strokeWidth={sw * 1.2} strokeLinecap="round"/>
        <polygon points="82,34 97,50 82,66" fill={color}/>
      </svg>
    );
  }

  if (type === "on ramp") {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-green-400 shrink-0" fill="none">
        <path d="M50 82 L50 38 Q50 22 65 22 L76 22" stroke={color} strokeWidth={sw * 1.2} strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="76,12 92,22 76,32" fill={color}/>
      </svg>
    );
  }

  if (type === "off ramp") {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-orange-400 shrink-0" fill="none">
        <path d="M50 18 L50 62 Q50 78 35 78 L24 78" stroke={color} strokeWidth={sw * 1.2} strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="24,68 8,78 24,88" fill={color}/>
      </svg>
    );
  }

  const m = modifier ?? "";
  const isLeft  = m.includes("left");
  const isRight = m.includes("right");
  const isSharp = m.includes("sharp");
  const isSlight = m.includes("slight");
  const isUturn = m === "uturn";

  if (isUturn) {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-green-400 shrink-0" fill="none">
        <path d="M62 82 L62 44 Q62 18 38 18 Q14 18 14 44 L14 56" stroke={color} strokeWidth={sw * 1.2} strokeLinecap="round"/>
        <polygon points="47,82 62,66 77,82" fill={color}/>
      </svg>
    );
  }

  if (isLeft && isSharp) {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-green-400 shrink-0" fill="none">
        <path d="M58 82 L58 46 L24 46" stroke={color} strokeWidth={sw * 1.2} strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="24,30 10,46 24,62" fill={color}/>
      </svg>
    );
  }

  if (isLeft) {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-green-400 shrink-0" fill="none">
        <path d="M58 82 L58 52 Q58 36 44 36 L28 36" stroke={color} strokeWidth={sw * 1.2} strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="12,36 28,22 28,50" fill={color}/>
      </svg>
    );
  }

  if (isRight && isSharp) {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-green-400 shrink-0" fill="none">
        <path d="M42 82 L42 46 L76 46" stroke={color} strokeWidth={sw * 1.2} strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="76,30 90,46 76,62" fill={color}/>
      </svg>
    );
  }

  if (isRight) {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-green-400 shrink-0" fill="none">
        <path d="M42 82 L42 52 Q42 36 56 36 L72 36" stroke={color} strokeWidth={sw * 1.2} strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="88,36 72,22 72,50" fill={color}/>
      </svg>
    );
  }

  if (isSlight && isLeft) {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-green-400 shrink-0" fill="none">
        <path d="M54 82 L54 52 Q54 34 36 24" stroke={color} strokeWidth={sw * 1.2} strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="20,18 40,16 34,34" fill={color}/>
      </svg>
    );
  }

  if (isSlight && isRight) {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100" className="text-green-400 shrink-0" fill="none">
        <path d="M46 82 L46 52 Q46 34 64 24" stroke={color} strokeWidth={sw * 1.2} strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="80,18 60,16 66,34" fill={color}/>
      </svg>
    );
  }

  // Straight ahead (default)
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" className="text-green-400 shrink-0" fill="none">
      <line x1="50" y1="76" x2="50" y2="32" stroke={color} strokeWidth={sw * 1.4} strokeLinecap="round"/>
      <polygon points="28,46 50,18 72,46" fill={color}/>
    </svg>
  );
}

function modifierLabel(m?: string): string {
  if (!m) return "";
  const map: Record<string, string> = {
    left: "Links", right: "Rechts",
    "slight left": "Halblinks", "slight right": "Halbrechts",
    "sharp left": "Scharf links", "sharp right": "Scharf rechts",
    uturn: "Wenden", straight: "Geradeaus",
  };
  return map[m] ?? m;
}

/** Lane indicator: shows which lanes to use at the next intersection */
function LaneIndicator({ lanes }: { lanes: Array<{ indications: string[]; valid: boolean }> }) {
  if (!lanes || lanes.length === 0) return null;
  return (
    <div className="flex items-center gap-1 mt-2 px-1">
      {lanes.map((lane, i) => {
        const main = lane.indications[0];
        return (
          <div
            key={i}
            className={`flex flex-col items-center justify-end rounded px-1.5 py-1 min-w-[24px] border transition-all ${
              lane.valid
                ? "bg-white/20 border-white/60 scale-110"
                : "bg-white/5 border-white/15 opacity-40"
            }`}
          >
            <ManeuverIcon
              type="turn"
              modifier={main === "uturn" ? "uturn" : main}
              size={10}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Geocode Input ────────────────────────────────────────────────────────────

interface GeoInputProps {
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (label: string, lat: number | null, lng: number | null) => void;
}

function GeoInput({ placeholder, icon, value, onChange }: GeoInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function handleChange(val: string) {
    setQuery(val);
    onChange(val, null, null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 3) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(val)}`);
        const data: NominatimResult[] = await res.json();
        setResults(Array.isArray(data) ? data.slice(0, 6) : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function select(r: NominatimResult) {
    const label = r.display_name.split(",").slice(0, 2).join(",").trim();
    setQuery(label);
    setOpen(false);
    setResults([]);
    onChange(label, parseFloat(r.lat), parseFloat(r.lon));
  }

  return (
    <div ref={containerRef} className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 focus-within:border-green-400 transition-colors">
        <span className="shrink-0">{icon}</span>
        {searching
          ? <Loader2 size={11} className="shrink-0 text-zinc-400 animate-spin" />
          : <Search size={10} className="shrink-0 text-zinc-300" />
        }
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none min-w-0"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setOpen(false); onChange("", null, null); }} className="text-zinc-300 hover:text-zinc-500">
            <X size={11} />
          </button>
        )}
        <button
          type="button"
          title="Aktuellen Standort verwenden"
          onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                const { latitude: lat, longitude: lon } = pos.coords;
                try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                  const data: unknown = await res.json();
                  // Validate the response: display_name must be a non-empty string.
                  // Sanitise by stripping HTML-significant characters and capping length
                  // to prevent any server-side tampering from affecting the UI.
                  const raw = (data as Record<string, unknown>)?.display_name;
                  const label =
                    typeof raw === "string" && raw.length > 0
                      ? raw.split(",").slice(0, 2).join(",").replace(/[<>'"&]/g, "").trim().slice(0, 200)
                      : "Mein Standort";
                  setQuery(label);
                  onChange(label, lat, lon);
                } catch {
                  setQuery("Mein Standort");
                  onChange("Mein Standort", lat, lon);
                }
              },
              () => {},
              { timeout: 6000 },
            );
          }}
          className="shrink-0 text-green-500 hover:text-green-400 transition-colors"
        >
          <LocateFixed size={13} />
        </button>
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[900] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => select(r)}
              className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors border-b border-zinc-100 dark:border-zinc-700 last:border-b-0"
            >
              <span className="font-medium">{r.display_name.split(",")[0]}</span>
              <span className="text-zinc-400 ml-1 text-[10px]">{r.display_name.split(",").slice(1, 3).join(",")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type PanelState = "expanded" | "collapsed" | "hidden";

export function NavigationWizard({ onRoute, onClear, preset, onPositionUpdate, onNavStop, onChargingStops, onNavActiveChange }: NavigationWizardProps) {
  const [panelState, setPanelState] = useState<PanelState>("expanded");

  // On mobile, start collapsed to avoid covering the map
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setPanelState("hidden");
    }
  }, []);
  // ── Vehicle type (determines OSRM routing profile) ──────────────────────
  type VehicleType = "car" | "scooter" | "escooter" | "foot";
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");

  const VEHICLE_OPTIONS: { type: VehicleType; emoji: string; label: string; osrm: string }[] = [
    { type: "car",     emoji: "🚗",  label: "E-Auto",     osrm: "driving" },
    { type: "scooter", emoji: "🛵",  label: "E-Roller",   osrm: "driving" },
    { type: "escooter",emoji: "🛴",  label: "E-Scooter",  osrm: "cycling" },
    { type: "foot",    emoji: "🚶",  label: "Zu Fuß",     osrm: "foot"    },
  ];
  const osrmProfile = VEHICLE_OPTIONS.find((v) => v.type === vehicleType)?.osrm ?? "driving";

  const [from, setFrom] = useState({ label: "", lat: null as number | null, lng: null as number | null });
  const [to, setTo] = useState({ label: "", lat: null as number | null, lng: null as number | null });
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<OsrmRoute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNavActive, setIsNavActive] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [distToNext, setDistToNext] = useState<number | null>(null);
  const [remainingDist, setRemainingDist] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const routeRef = useRef<OsrmRoute | null>(null);
  const currentStepIdxRef = useRef(0); // imperative tracker – avoids stale closures in GPS callbacks

  // ── Charging-stop planning ──────────────────────────────────────────────
  const [vehicleRangeKm, setVehicleRangeKm] = useState(300);
  const [currentBattery, setCurrentBattery] = useState(80);
  const [chargingPlan, setChargingPlan] = useState<ChargingStopPlan | null>(null);
  const [planningStops, setPlanningStops] = useState(false);

  const geocode = useCallback(async (q: string): Promise<[number, number] | null> => {
    if (!q.trim()) return null;
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch { return null; }
  }, []);

  const calculateWithCoords = useCallback(async (fLat: number, fLng: number, tLat: number, tLng: number) => {
    setError(null);
    setRoute(null);
    setLoading(true);
    setCurrentStepIdx(0);
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${fLng},${fLat};${tLng},${tLat}?overview=full&geometries=geojson&steps=true&annotations=true`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OSRM ${res.status}`);
      const json = await res.json();
      if (!json.routes?.length) { setError("Keine Route gefunden."); setLoading(false); return; }
      const r = json.routes[0];
      const steps: OsrmStep[] = (r.legs ?? []).flatMap((leg: { steps?: OsrmStep[] }) => leg.steps ?? []);
      const parsed: OsrmRoute = { distance: r.distance, duration: r.duration, geometry: r.geometry as GeoJSON.LineString, steps };
      setRoute(parsed);
      routeRef.current = parsed;
      setRemainingDist(parsed.distance);
      setRemainingTime(parsed.duration);
      onRoute({ type: "FeatureCollection", features: [{ type: "Feature", geometry: parsed.geometry, properties: {} }] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Routing-Fehler");
    } finally {
      setLoading(false);
    }
  }, [onRoute, osrmProfile]);

  const handlePlanStops = useCallback(async (r: OsrmRoute) => {
    setPlanningStops(true);
    try {
      const plan = await planChargingStops(
        r.geometry,
        r.distance,
        vehicleRangeKm,
        currentBattery,
      );
      setChargingPlan(plan);
      onChargingStops?.(plan.stops);
    } catch {
      // silently ignore planning errors
    } finally {
      setPlanningStops(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleRangeKm, currentBattery]);

  useEffect(() => {
    if (!preset) return;
    setTo({ label: preset.toLabel, lat: preset.toCoord[0], lng: preset.toCoord[1] });
    setPanelState("expanded");

    // If start is "Aktueller Standort", try to get fresh GPS before calculating
    if (preset.fromLabel === "Aktueller Standort" && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const fLat = pos.coords.latitude, fLng = pos.coords.longitude;
          setFrom({ label: "Aktueller Standort", lat: fLat, lng: fLng });
          void calculateWithCoords(fLat, fLng, preset.toCoord[0], preset.toCoord[1]);
        },
        () => {
          // GPS failed – use preset coords as fallback
          setFrom({ label: preset.fromLabel, lat: preset.fromCoord[0], lng: preset.fromCoord[1] });
          void calculateWithCoords(preset.fromCoord[0], preset.fromCoord[1], preset.toCoord[0], preset.toCoord[1]);
        },
        { timeout: 6000, enableHighAccuracy: true },
      );
    } else {
      setFrom({ label: preset.fromLabel, lat: preset.fromCoord[0], lng: preset.fromCoord[1] });
      void calculateWithCoords(preset.fromCoord[0], preset.fromCoord[1], preset.toCoord[0], preset.toCoord[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  async function handleCalculate() {
    setError(null);
    setLoading(true);
    let fLat = from.lat, fLng = from.lng, tLat = to.lat, tLng = to.lng;
    if (fLat === null || fLng === null) {
      const c = await geocode(from.label);
      if (!c) { setError("Startadresse nicht gefunden."); setLoading(false); return; }
      [fLat, fLng] = c;
      setFrom(p => ({ ...p, lat: fLat, lng: fLng }));
    }
    if (tLat === null || tLng === null) {
      const c = await geocode(to.label);
      if (!c) { setError("Zieladresse nicht gefunden."); setLoading(false); return; }
      [tLat, tLng] = c;
      setTo(p => ({ ...p, lat: tLat, lng: tLng }));
    }
    setLoading(false);
    await calculateWithCoords(fLat!, fLng!, tLat!, tLng!);
  }

  function startNavigation() {
    if (!navigator.geolocation) { setError("GPS nicht verfügbar."); return; }
    setIsNavActive(true);
    onNavActiveChange?.(true);
    setCurrentStepIdx(0);
    currentStepIdxRef.current = 0;
    navStartedAtRef.current = new Date().toISOString();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading } = pos.coords;
        const bear = heading ?? 0;
        onPositionUpdate?.([latitude, longitude, bear]);
        const r = routeRef.current;
        if (!r) return;

        // Imperative step advancement via ref (avoids stale closures in setState)
        let idx = currentStepIdxRef.current;
        const nextStep = r.steps[idx + 1];
        if (nextStep?.maneuver?.location && idx < r.steps.length - 1) {
          const d = distanceM(latitude, longitude, nextStep.maneuver.location[1], nextStep.maneuver.location[0]);
          if (d < 150) {
            idx++;
            currentStepIdxRef.current = idx;
            setCurrentStepIdx(idx);
          }
        }

        // Distance to the next upcoming maneuver point
        const upcoming = r.steps[idx + 1];
        if (upcoming?.maneuver?.location) {
          setDistToNext(distanceM(latitude, longitude, upcoming.maneuver.location[1], upcoming.maneuver.location[0]));
        }

        // Remaining route distance + ETA
        const dest = r.geometry.coordinates[r.geometry.coordinates.length - 1];
        const left = distanceM(latitude, longitude, dest[1], dest[0]);
        setRemainingDist(left);
        setRemainingTime(Math.round(left / 15));
      },
      (err) => { setError(`GPS: ${err.message}`); stopNavigation(); },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    );
  }

  const navStartedAtRef = useRef<string | null>(null);

  function stopNavigation() {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    setIsNavActive(false);
    onNavActiveChange?.(false);
    onNavStop?.();

    // Save completed trip to archive
    const r = routeRef.current;
    if (r && from.label && to.label) {
      void fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_label: from.label,
          to_label: to.label,
          from_lat: from.lat,
          from_lng: from.lng,
          to_lat: to.lat,
          to_lng: to.lng,
          distance_m: r.distance,
          duration_s: r.duration,
          charging_stops: chargingPlan?.stops ?? [],
          route_geometry: r.geometry,
          started_at: navStartedAtRef.current ?? new Date().toISOString(),
          ended_at: new Date().toISOString(),
        }),
      }).catch(() => { /* silently ignore — user may not be logged in */ });
    }
    navStartedAtRef.current = null;
  }

  function handleClear() {
    stopNavigation();
    setRoute(null); setError(null);
    setFrom({ label: "", lat: null, lng: null });
    setTo({ label: "", lat: null, lng: null });
    setCurrentStepIdx(0); currentStepIdxRef.current = 0; setDistToNext(null);
    setChargingPlan(null);
    onChargingStops?.([]);
    onClear();
  }

  useEffect(() => () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  const canCalculate = !loading && ((from.lat !== null && to.lat !== null) || (from.label.trim().length >= 3 && to.label.trim().length >= 3));
  const currentStep = route?.steps[currentStepIdx];
  const nextStep = route?.steps[currentStepIdx + 1];
  // Show the NEXT upcoming maneuver (Google Maps convention); fall back to current at journey end
  const displayStep = nextStep ?? currentStep;

  // ── Google Maps-style bottom HUD during active navigation ────────────────
  if (isNavActive) {
    return (
      <>
        {/* Mini status pill — top-right */}
        <div className="absolute top-3 right-3 z-[700]">
          <div className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl px-3.5 py-2.5 shadow-2xl border border-green-500/30">
            <Navigation size={14} className="shrink-0" />
            {remainingDist !== null && (
              <span className="text-sm font-black">{fmtDist(remainingDist)}</span>
            )}
            {remainingTime !== null && (
              <span className="text-xs text-green-200 font-medium">· {fmtTime(remainingTime)}</span>
            )}
            <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold animate-pulse ml-1">LIVE</span>
            <button
              type="button"
              onClick={stopNavigation}
              className="ml-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors"
              title="Navigation stoppen"
            >
              <Square size={10} />
            </button>
          </div>
        </div>

        {/* Bottom-center Google Maps-style HUD */}
        {currentStep && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[700]" style={{ width: "min(90vw, 520px)" }}>
            <div className="bg-[#0a1a0e]/97 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-green-900/30">

              {/* Main maneuver row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="bg-green-600 rounded-2xl p-4 shrink-0 shadow-lg">
                  <ManeuverIcon type={displayStep!.maneuver.type} modifier={displayStep!.maneuver.modifier} size={42} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-4xl font-black text-white leading-none">
                    {distToNext !== null ? fmtDist(distToNext) : fmtDist(displayStep!.distance)}
                  </p>
                  {displayStep!.maneuver.modifier && (
                    <p className="text-sm font-bold text-green-400 mt-0.5">
                      {modifierLabel(displayStep!.maneuver.modifier)}
                    </p>
                  )}
                  <p className="text-base font-semibold text-zinc-200 truncate mt-0.5">
                    {displayStep!.name || (nextStep ? nextStep.name : "Ziel erreicht")}
                  </p>
                </div>
              </div>

              {/* Lane indicator */}
              {(() => {
                const lanes = displayStep!.intersections?.[0]?.lanes;
                return lanes && lanes.length > 0 ? (
                  <div className="px-5 pb-3 -mt-1">
                    <p className="text-[9px] text-green-400/70 uppercase tracking-wider mb-1.5 font-bold">Spurempfehlung</p>
                    <LaneIndicator lanes={lanes} />
                  </div>
                ) : null;
              })()}

              {/* Status row */}
              <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.03] border-t border-green-900/30">
                <MapPin size={13} className="text-zinc-500 shrink-0" />
                <span className="text-sm font-semibold text-zinc-200">
                  {remainingDist !== null ? `Noch ${fmtDist(remainingDist)}` : "\u2014"}
                </span>
                {remainingTime !== null && (
                  <span className="text-sm text-zinc-400">{"\u00b7"} ca. {fmtTime(remainingTime)}</span>
                )}
                {remainingTime !== null && (() => {
                  const arrival = new Date(Date.now() + remainingTime * 1000);
                  const hh = String(arrival.getHours()).padStart(2, "0");
                  const mm = String(arrival.getMinutes()).padStart(2, "0");
                  return (
                    <span className="flex items-center gap-1 text-xs text-green-300 font-semibold ml-auto">
                      <Clock size={11} className="shrink-0" />
                      {hh}:{mm}
                    </span>
                  );
                })()}
                {chargingPlan && chargingPlan.stops.length > 0 && remainingDist !== null && route && (() => {
                  const driven = route.distance - remainingDist;
                  const nextStop = chargingPlan.stops.find((s) => s.distanceFromStartM > driven);
                  if (!nextStop) return null;
                  const distToStop = Math.max(0, nextStop.distanceFromStartM - driven);
                  return (
                    <span className="flex items-center gap-1 text-xs text-orange-300 font-semibold">
                      <BatteryCharging size={11} className="shrink-0 text-orange-400" />
                      Laden in {fmtDist(distToStop)}
                    </span>
                  );
                })()}
                <button
                  type="button"
                  onClick={stopNavigation}
                  className="ml-auto flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors"
                >
                  <Square size={11} />
                  Stopp
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (panelState === "hidden") {
    return (
      <div className="absolute bottom-28 md:bottom-24 right-4 z-[630]">
        <button type="button" onClick={() => setPanelState("expanded")} className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3.5 shadow-xl transition-colors" title="Navigation öffnen">
          <Navigation size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-3 right-3 z-[700] w-[calc(100vw-1.5rem)] md:w-80 max-w-sm flex flex-col">
      <div className="flex flex-col bg-white/97 dark:bg-zinc-900/97 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-green-600 to-green-700 rounded-t-2xl">
          <Navigation size={15} className="text-white shrink-0" />
          <span className="flex-1 text-sm font-bold text-white tracking-wide">
            {isNavActive ? "Navigation läuft…" : "Navigation"}
          </span>
          {isNavActive && (
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
          )}
          <button type="button" onClick={() => setPanelState(panelState === "expanded" ? "collapsed" : "expanded")} className="p-1 text-white/70 hover:text-white rounded">
            {panelState === "expanded" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button type="button" onClick={() => { handleClear(); setPanelState("hidden"); }} className="p-1 text-white/70 hover:text-white rounded" title="Ausblenden">
            <Minus size={14} />
          </button>
        </div>

        {/* Live nav maneuver banner */}
        {isNavActive && panelState === "expanded" && currentStep && (
          <div className="bg-green-900 dark:bg-green-950 px-4 py-3 border-b border-green-800">
            <div className="flex items-center gap-3">
              <div className="bg-green-700 rounded-xl p-2.5 shrink-0">
                <ManeuverIcon type={displayStep!.maneuver.type} modifier={displayStep!.maneuver.modifier} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                {distToNext !== null && (
                  <p className="text-2xl font-black text-white leading-none">{fmtDist(distToNext)}</p>
                )}
                <p className="text-sm text-green-200 font-semibold truncate mt-0.5">
                  {displayStep!.name || "Ziel erreicht"}
                </p>
              </div>
              {displayStep!.maneuver.modifier && (
                <p className="text-xs text-green-300 font-bold shrink-0">{modifierLabel(displayStep!.maneuver.modifier)}</p>
              )}
            </div>
            {/* Lane indicator — shown when intersection has lane data */}
            {(() => {
              const lanes = currentStep.intersections?.[0]?.lanes;
              return lanes && lanes.length > 0 ? (
                <div className="mt-2 px-1">
                  <p className="text-[9px] text-green-400 uppercase tracking-wider mb-1 font-bold">Spurempfehlung</p>
                  <LaneIndicator lanes={lanes} />
                </div>
              ) : null;
            })()}
            {remainingDist !== null && (
              <div className="mt-2 flex items-center gap-3 text-xs text-green-300">
                <span>Noch {fmtDist(remainingDist)}</span>
                {remainingTime !== null && <span>· ca. {fmtTime(remainingTime)}</span>}
                <button type="button" onClick={stopNavigation} className="ml-auto flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg font-bold transition-colors">
                  <Square size={10} /> Stopp
                </button>
              </div>
            )}
            {/* Next charging stop indicator */}
            {chargingPlan && chargingPlan.stops.length > 0 && remainingDist !== null && route && (() => {
              const driven = route.distance - remainingDist;
              const next = chargingPlan.stops.find((s) => s.distanceFromStartM > driven);
              if (!next) return null;
              const distToStop = Math.max(0, next.distanceFromStartM - driven);
              return (
                <div className="mt-1.5 flex items-center gap-2 bg-orange-600/30 rounded-lg px-2.5 py-1.5 text-[11px] text-orange-200">
                  <BatteryCharging size={12} className="shrink-0 text-orange-300" />
                  <span className="font-semibold">Ladestopp in {fmtDist(distToStop)}:</span>
                  <span className="truncate">{next.name}</span>
                </div>
              );
            })()}
          </div>
        )}

        {panelState === "expanded" && (
          <>
            {/* Inputs (hidden during nav) */}
            {!isNavActive && (
              <div className="p-3 space-y-2 border-b border-zinc-100 dark:border-zinc-800">
                {/* Vehicle type selector */}
                <div className="flex items-center gap-1.5">
                  {VEHICLE_OPTIONS.map((v) => (
                    <button
                      key={v.type}
                      type="button"
                      onClick={() => setVehicleType(v.type)}
                      title={v.label}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl border text-[10px] font-semibold transition-colors ${
                        vehicleType === v.type
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-green-400"
                      }`}
                    >
                      <span className="text-base leading-none">{v.emoji}</span>
                      {v.label}
                    </button>
                  ))}
                </div>
                <GeoInput placeholder="Startadresse…" icon={<MapPin size={13} className="text-green-500" />} value={from.label} onChange={(l, lat, lng) => setFrom({ label: l, lat, lng })} />
                <div className="flex justify-center py-0.5"><div className="w-px h-3 bg-zinc-200 dark:bg-zinc-700" /></div>
                <GeoInput placeholder="Zieladresse…" icon={<MapPin size={13} className="text-red-500" />} value={to.label} onChange={(l, lat, lng) => setTo({ label: l, lat, lng })} />
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => { handleCalculate(); }} disabled={!canCalculate} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                    {loading ? "Wird berechnet…" : "Route berechnen"}
                  </button>
                  {route && (
                    <button type="button" onClick={handleClear} className="px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-red-500 hover:border-red-400 transition-colors" title="Löschen">
                      <X size={13} />
                    </button>
                  )}
                </div>
                {error && (
                  <div className="flex items-start gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}
              </div>
            )}

            {/* Route summary + start nav */}
            {route && !isNavActive && (
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2 flex items-center gap-3">
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">{fmtDist(route.distance)}</span>
                  <span className="text-green-400">·</span>
                  <span className="text-sm text-green-600 dark:text-green-400">{fmtTime(route.duration)}</span>
                  {chargingPlan && chargingPlan.stops.length > 0 && (
                    <span className="ml-auto text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      +{chargingPlan.totalChargingMinutes} min Laden
                    </span>
                  )}
                  {chargingPlan && chargingPlan.stops.length === 0 && (
                    <span className="ml-auto text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                      Reichweite OK ✓
                    </span>
                  )}
                  {!chargingPlan && (
                    <span className="ml-auto text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold">Karte ✓</span>
                  )}
                </div>
                <button type="button" onClick={startNavigation} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors">
                  <Play size={14} /> Navigation starten (GPS)
                </button>
              </div>
            )}

            {/* ── Ladeplanung ── */}
            {route && !isNavActive && (
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <BatteryCharging size={12} className="text-orange-500" />
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Ladeplanung</p>
                </div>
                {/* Range slider */}
                <div className="flex items-center gap-2">
                  <Zap size={10} className="text-orange-400 shrink-0" />
                  <span className="text-[11px] text-zinc-500 w-16">Reichweite</span>
                  <input
                    type="range" min={80} max={800} step={10}
                    value={vehicleRangeKm}
                    onChange={(e) => setVehicleRangeKm(Number(e.target.value))}
                    className="flex-1 accent-orange-500 h-1.5"
                  />
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 w-14 text-right">{vehicleRangeKm} km</span>
                </div>
                {/* Battery slider */}
                <div className="flex items-center gap-2">
                  <BatteryCharging size={10} className="text-green-400 shrink-0" />
                  <span className="text-[11px] text-zinc-500 w-16">Akku jetzt</span>
                  <input
                    type="range" min={10} max={100} step={5}
                    value={currentBattery}
                    onChange={(e) => setCurrentBattery(Number(e.target.value))}
                    className="flex-1 accent-green-500 h-1.5"
                  />
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 w-14 text-right">{currentBattery} %</span>
                </div>
                {/* Plan button */}
                <button
                  type="button"
                  onClick={() => void handlePlanStops(route)}
                  disabled={planningStops}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white transition-colors"
                >
                  {planningStops
                    ? <><Loader2 size={12} className="animate-spin" /> Berechne…</>
                    : <><Zap size={12} /> Ladestopps planen</>}
                </button>
              </div>
            )}

            {/* ── Ladestopps Ergebnis ── */}
            {chargingPlan && !isNavActive && (
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 space-y-1.5">
                {chargingPlan.stops.length === 0 ? (
                  <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1.5">
                    <CheckCircle size={12} /> Kein Ladestopp nötig – Reichweite ausreichend.
                  </p>
                ) : (
                  <>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-orange-500 flex items-center gap-1">
                      <BatteryCharging size={10} />
                      {chargingPlan.stops.length} Ladestopp{chargingPlan.stops.length > 1 ? "s" : ""} · +{chargingPlan.totalChargingMinutes} min
                    </p>
                    {chargingPlan.stops.map((stop, i) => (
                      <div key={i} className="flex items-start gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2.5 py-2 text-xs">
                        <div className="bg-orange-500 rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-white text-[8px] font-black">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">{stop.name}</p>
                          <p className="text-[10px] text-zinc-400">
                            nach {fmtDist(stop.distanceFromStartM)} · {stop.powerKw} kW · ca. {stop.estimatedChargingMinutes} min
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Turn-by-turn list */}
            {route && route.steps.length > 0 && (
              <div className="overflow-y-auto max-h-56 p-2 space-y-0.5">
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 px-2 pb-1 font-semibold">Abbiegehinweise</p>
                {route.steps.map((step, i) => (
                  <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${isNavActive && i === currentStepIdx ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
                    <ManeuverIcon type={step.maneuver.type} modifier={step.maneuver.modifier} size={12} />
                    <span className={`flex-1 text-xs truncate ${isNavActive && i === currentStepIdx ? "text-green-700 dark:text-green-300 font-semibold" : "text-zinc-700 dark:text-zinc-200"}`}>
                      {step.name || step.maneuver.type}
                    </span>
                    {step.distance > 0 && <span className="text-[10px] text-zinc-400 shrink-0">{fmtDist(step.distance)}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!route && !loading && !error && (
              <div className="p-5 text-center">
                <Navigation size={28} className="text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 leading-relaxed">Gib Start und Ziel ein — die Route wird auf der Karte eingezeichnet.</p>
              </div>
            )}
          </>
        )}

        {/* Collapsed summary */}
        {panelState === "collapsed" && route && (
          <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 flex items-center gap-2">
            <span className="text-xs font-bold text-green-700 dark:text-green-300">{fmtDist(route.distance)}</span>
            <span className="text-green-400 text-xs">·</span>
            <span className="text-xs text-green-600 dark:text-green-400">{fmtTime(route.duration)}</span>
            {isNavActive && <span className="ml-auto text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>}
          </div>
        )}
      </div>
    </div>
  );
}
