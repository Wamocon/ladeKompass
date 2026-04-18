"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Zap,
  MapPin,
  CircleDot,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  Settings2,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import type { OCMStation } from "@/app/api/stations/route";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StationCard {
  id: number;
  title: string;
  town: string;
  distanceKm: number;
  maxKw: number;
  isOperational: boolean | null;
  isOpen247: boolean;
  points: number;
  connectors: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function maxKwFromStation(s: OCMStation): number {
  const kws = (s.Connections ?? [])
    .map((c) => Number(c.PowerKW ?? 0))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return kws.length ? Math.max(0, ...kws) : 0;
}

function connectorLabels(s: OCMStation): string[] {
  return [
    ...new Set(
      (s.Connections ?? [])
        .map((c) => c.ConnectionType?.Title ?? "")
        .filter(Boolean)
        .map((t) => t.split("(")[0].trim()),
    ),
  ].slice(0, 3);
}

function kwColor(kw: number): string {
  if (kw >= 150) return "text-green-400";
  if (kw >= 50) return "text-cyan-400";
  if (kw >= 22) return "text-violet-400";
  if (kw > 0) return "text-green-500";
  return "text-amber-400";
}

function toCard(s: OCMStation, userLat: number, userLng: number): StationCard {
  return {
    id: s.ID,
    title: s.AddressInfo.Title,
    town: s.AddressInfo.Town ?? "",
    distanceKm: haversineKm(
      userLat,
      userLng,
      s.AddressInfo.Latitude,
      s.AddressInfo.Longitude,
    ),
    maxKw: maxKwFromStation(s),
    isOperational: s.StatusType?.IsOperational ?? null,
    isOpen247: s.OpeningTimes?.IsOpen247 ?? false,
    points: s.NumberOfPoints ?? 0,
    connectors: connectorLabels(s),
  };
}

// ─── Radius Selector ─────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [10, 25, 50, 100] as const;
type Radius = (typeof RADIUS_OPTIONS)[number];

function RadiusSelector({
  value,
  onChange,
}: {
  value: Radius;
  onChange: (r: Radius) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Settings2 size={13} className="text-[var(--text-muted)]" />
      {RADIUS_OPTIONS.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
            value === r
              ? "bg-[var(--primary)] border-[var(--primary)] text-white font-semibold"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--text-base)]"
          }`}
        >
          {r} km
        </button>
      ))}
    </div>
  );
}

// ─── Availability Feed ────────────────────────────────────────────────────────

function AvailabilityFeed({
  stations,
  loading,
}: {
  stations: StationCard[];
  loading: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const operational = stations.filter((s) => s.isOperational !== false);
  const offline = stations.filter((s) => s.isOperational === false);
  const visible = showAll ? stations : stations.slice(0, 5);

  if (loading) return <FeedSkeleton rows={4} />;

  return (
    <div className="space-y-2">
      {stations.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] text-center py-6">
          Keine Stationen in diesem Radius gefunden.
        </p>
      )}

      {/* Summary bar */}
      {stations.length > 0 && (
        <div className="flex gap-3 text-xs mb-3">
          <span className="flex items-center gap-1 text-green-400">
            <Wifi size={12} /> {operational.length} verfügbar
          </span>
          {offline.length > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <WifiOff size={12} /> {offline.length} offline
            </span>
          )}
        </div>
      )}

      {visible.map((s) => (
        <div
          key={s.id}
          className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5"
        >
          <div
            className={`shrink-0 mt-0.5 ${
              s.isOperational === false
                ? "text-red-400"
                : s.isOperational === true
                  ? "text-green-400"
                  : "text-amber-400"
            }`}
          >
            <CircleDot size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--text-base)] truncate">
              {s.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-[var(--text-muted)]">
                {s.distanceKm.toFixed(1)} km
              </span>
              {s.points > 0 && (
                <span className="text-[10px] text-[var(--text-muted)]">
                  {s.points} Punkte
                </span>
              )}
              {s.maxKw > 0 && (
                <span className={`text-[10px] font-bold ${kwColor(s.maxKw)}`}>
                  ⚡ {s.maxKw} kW
                </span>
              )}
              {s.isOpen247 && (
                <span className="text-[10px] text-green-500">24/7</span>
              )}
            </div>
          </div>
          <div
            className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              s.isOperational === false
                ? "bg-red-900/30 text-red-400"
                : s.isOperational === true
                  ? "bg-green-900/30 text-green-400"
                  : "bg-amber-900/30 text-amber-400"
            }`}
          >
            {s.isOperational === false
              ? "Offline"
              : s.isOperational === true
                ? "Online"
                : "Unbekannt"}
          </div>
        </div>
      ))}

      {stations.length > 5 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] py-2 hover:text-[var(--text-base)] transition-colors"
        >
          <ChevronDown
            size={13}
            className={`transition-transform ${showAll ? "rotate-180" : ""}`}
          />
          {showAll ? "Weniger anzeigen" : `${stations.length - 5} weitere`}
        </button>
      )}
    </div>
  );
}

// ─── HPC / Fast Charger Feed ──────────────────────────────────────────────────

function FastChargerFeed({
  stations,
  loading,
}: {
  stations: StationCard[];
  loading: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const hpc = stations
    .filter((s) => s.maxKw >= 50 && s.isOperational !== false)
    .sort((a, b) => b.maxKw - a.maxKw);
  const visible = showAll ? hpc : hpc.slice(0, 5);

  if (loading) return <FeedSkeleton rows={3} />;

  return (
    <div className="space-y-2">
      {hpc.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] text-center py-6">
          Kein Schnellader in diesem Radius gefunden.
        </p>
      )}

      {visible.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5"
        >
          <Zap size={14} className={kwColor(s.maxKw)} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--text-base)] truncate">
              {s.title}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {s.distanceKm.toFixed(1)} km · {s.town}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-black ${kwColor(s.maxKw)}`}>
              {s.maxKw} kW
            </p>
            {s.connectors.length > 0 && (
              <p className="text-[9px] text-[var(--text-muted)] max-w-[80px] truncate">
                {s.connectors.join(" · ")}
              </p>
            )}
          </div>
        </div>
      ))}

      {hpc.length > 5 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] py-2 hover:text-[var(--text-base)] transition-colors"
        >
          <ChevronDown
            size={13}
            className={`transition-transform ${showAll ? "rotate-180" : ""}`}
          />
          {showAll ? "Weniger" : `${hpc.length - 5} weitere`}
        </button>
      )}
    </div>
  );
}

// ─── Nearest Cheap Feed ───────────────────────────────────────────────────────

function NearestFeed({
  stations,
  loading,
}: {
  stations: StationCard[];
  loading: boolean;
}) {
  if (loading) return <FeedSkeleton rows={3} />;

  const nearest = [...stations]
    .filter((s) => s.isOperational !== false)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 8);

  return (
    <div className="space-y-2">
      {nearest.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] text-center py-6">
          Keine Stationen gefunden.
        </p>
      )}
      {nearest.map((s, i) => (
        <div
          key={s.id}
          className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5"
        >
          <span className="shrink-0 text-xs font-black text-[var(--text-muted)] w-4 text-center">
            {i + 1}
          </span>
          <MapPin size={13} className="shrink-0 text-[var(--primary)]" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--text-base)] truncate">
              {s.title}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">{s.town}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-black text-[var(--primary)]">
              {s.distanceKm.toFixed(1)} km
            </p>
            {s.maxKw > 0 && (
              <p className={`text-[10px] font-bold ${kwColor(s.maxKw)}`}>
                {s.maxKw} kW
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FeedSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse"
        />
      ))}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type FeedTab = "nearest" | "fast" | "availability";

const TABS: { id: FeedTab; label: string; icon: React.ReactNode }[] = [
  { id: "nearest", label: "Nächste", icon: <MapPin size={13} /> },
  { id: "fast", label: "Schnelllader", icon: <Zap size={13} /> },
  { id: "availability", label: "Status", icon: <CircleDot size={13} /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function NearbyFeed() {
  const t = useTranslations("dashboard");
  const [radius, setRadius] = useState<Radius>(50);
  const [activeTab, setActiveTab] = useState<FeedTab>("nearest");
  const [stations, setStations] = useState<StationCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStations = useCallback(
    async (lat: number, lng: number, r: number) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          distance: String(r),
          maxResults: "120",
        });
        const res = await fetch(`/api/stations?${params}`, {
          signal: abortRef.current.signal,
        });
        if (!res.ok) throw new Error("Fehler beim Laden");
        const data: OCMStation[] = await res.json();
        setStations(data.map((s) => toCard(s, lat, lng)));
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") {
          setError("Stationen konnten nicht geladen werden.");
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Request location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        fetchStations(loc.lat, loc.lng, radius);
      },
      () => setLocationDenied(true),
      { timeout: 8000 },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when radius changes
  useEffect(() => {
    if (location) fetchStations(location.lat, location.lng, radius);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} className="text-[var(--primary)]" />
          <h2 className="text-sm font-bold text-[var(--text-base)]">
            {t("nearby_title", { fallback: "In der Nähe" })}
          </h2>
          {stations.length > 0 && (
            <span className="text-[10px] bg-[var(--primary-light-soft)] text-[var(--primary)] px-2 py-0.5 rounded-full font-semibold">
              {stations.length}
            </span>
          )}
        </div>
        <button
          onClick={() => location && fetchStations(location.lat, location.lng, radius)}
          disabled={loading || !location}
          className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors disabled:opacity-40"
          aria-label="Aktualisieren"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Radius selector */}
      <div className="mb-4">
        <RadiusSelector value={radius} onChange={setRadius} />
      </div>

      {/* Location denied */}
      {locationDenied && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 mb-4">
          <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            Standort nicht verfügbar. Bitte Standortzugriff im Browser erlauben, um Stationen in der Nähe zu sehen.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 mb-3">{error}</p>
      )}

      {/* Tab bar */}
      {!locationDenied && (
        <>
          <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? "border-[var(--primary)] text-[var(--primary)] font-semibold"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-base)]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "nearest" && (
            <NearestFeed stations={stations} loading={loading} />
          )}
          {activeTab === "fast" && (
            <FastChargerFeed stations={stations} loading={loading} />
          )}
          {activeTab === "availability" && (
            <AvailabilityFeed stations={stations} loading={loading} />
          )}
        </>
      )}
    </div>
  );
}
