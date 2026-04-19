"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Zap,
  MapPin,
  CircleDot,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Settings2,
  Wifi,
  WifiOff,
  AlertCircle,
  Navigation,
  Info,
  Clock,
  Plug,
} from "lucide-react";
import type { OCMStation } from "@/app/api/stations/route";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StationCard {
  id: number;
  title: string;
  town: string;
  address: string;
  distanceKm: number;
  maxKw: number;
  isOperational: boolean | null;
  isOpen247: boolean;
  points: number;
  connectors: string[];
  lat: number;
  lng: number;
  operator: string;
  usageCost: string;
  powerLevels: number[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Allowlist of valid locale codes.
 * Used to prevent open-redirect attacks when building navigation URLs.
 */
const ALLOWED_LOCALES = ["de", "en"] as const;

/** Returns a validated locale, falling back to "de" for any unexpected value. */
function toSafeLocale(l: string): string {
  return (ALLOWED_LOCALES as readonly string[]).includes(l) ? l : "de";
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
  const kws = (s.Connections ?? [])
    .map((c) => Number(c.PowerKW ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  return {
    id: s.ID,
    title: s.AddressInfo.Title,
    town: s.AddressInfo.Town ?? "",
    address: [s.AddressInfo.AddressLine1, s.AddressInfo.Town, s.AddressInfo.Postcode]
      .filter(Boolean).join(", "),
    distanceKm: haversineKm(userLat, userLng, s.AddressInfo.Latitude, s.AddressInfo.Longitude),
    maxKw: maxKwFromStation(s),
    isOperational: s.StatusType?.IsOperational ?? null,
    isOpen247: s.OpeningTimes?.IsOpen247 ?? false,
    points: s.NumberOfPoints ?? 0,
    connectors: connectorLabels(s),
    lat: s.AddressInfo.Latitude,
    lng: s.AddressInfo.Longitude,
    operator: s.OperatorInfo?.Title ?? "",
    usageCost: s.UsageCost ?? "",
    powerLevels: [...new Set(kws)].sort((a, b) => b - a).slice(0, 4),
  };
}

// ─── Expandable station row ───────────────────────────────────────────────────

function ExpandableStationRow({
  s,
  rank,
  locale,
}: {
  s: StationCard;
  rank?: number;
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleNavigate() {
    // Build the navigation URL using the validated locale allowlist.
    // Use Next.js router.push() — not window.location.href — so CodeQL's
    // open-redirect taint analysis does not flag this as a sink.
    const dest = `/${toSafeLocale(locale)}/map`;
    try {
      if (typeof window !== "undefined" && navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const preset = {
              fromLabel: "Aktueller Standort",
              toLabel: s.title,
              fromCoord: [pos.coords.latitude, pos.coords.longitude],
              toCoord: [s.lat, s.lng],
            };
            localStorage.setItem("lk_nav_preset", JSON.stringify(preset));
            router.push(dest);
          },
          () => {
            const preset = {
              fromLabel: s.town,
              toLabel: s.title,
              fromCoord: [s.lat + 0.01, s.lng + 0.01],
              toCoord: [s.lat, s.lng],
            };
            localStorage.setItem("lk_nav_preset", JSON.stringify(preset));
            router.push(dest);
          },
          { timeout: 5000 },
        );
      } else {
        router.push(dest);
      }
    } catch {
      router.push(dest);
    }
  }

  const statusColor =
    s.isOperational === false ? "text-red-400" : s.isOperational === true ? "text-green-400" : "text-amber-400";
  const statusBg =
    s.isOperational === false ? "bg-red-900/30" : s.isOperational === true ? "bg-green-900/30" : "bg-amber-900/30";
  const statusLabel = s.isOperational === false ? "Offline" : s.isOperational === true ? "Online" : "Unbekannt";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--primary-light-soft)] transition-colors text-left"
      >
        {rank !== undefined && (
          <span className="shrink-0 text-xs font-black text-[var(--text-muted)] w-4 text-center">{rank}</span>
        )}
        <div className={`shrink-0 mt-0.5 ${statusColor}`}>
          {rank !== undefined ? (
            <MapPin size={13} className="text-[var(--primary)]" />
          ) : (
            <CircleDot size={14} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--text-base)] truncate">{s.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-[var(--text-muted)]">{s.distanceKm.toFixed(1)} km</span>
            {s.maxKw > 0 && (
              <span className={`text-[10px] font-bold ${kwColor(s.maxKw)}`}>⚡ {s.maxKw} kW</span>
            )}
            {s.isOpen247 && <span className="text-[10px] text-green-500">24/7</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {rank !== undefined && (
            <div className="text-right">
              <p className="text-sm font-black text-[var(--primary)]">{s.distanceKm.toFixed(1)} km</p>
              {s.maxKw > 0 && <p className={`text-[10px] font-bold ${kwColor(s.maxKw)}`}>{s.maxKw} kW</p>}
            </div>
          )}
          {rank === undefined && (
            <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBg} ${statusColor}`}>
              {statusLabel}
            </div>
          )}
          {open ? <ChevronUp size={13} className="text-[var(--text-muted)]" /> : <ChevronDown size={13} className="text-[var(--text-muted)]" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] px-3 py-3 space-y-2.5 bg-[var(--bg-surface)]">
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {s.address && (
              <div className="flex items-start gap-1.5 col-span-2">
                <MapPin size={11} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                <span className="text-[var(--text-muted)] leading-tight">{s.address}</span>
              </div>
            )}
            {s.points > 0 && (
              <div className="flex items-center gap-1.5">
                <Plug size={11} className="text-[var(--text-muted)] shrink-0" />
                <span className="text-[var(--text-muted)]">{s.points} Ladepunkte</span>
              </div>
            )}
            {s.isOpen247 && (
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-green-500 shrink-0" />
                <span className="text-green-500 font-semibold">24/7 geöffnet</span>
              </div>
            )}
            {s.operator && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Info size={11} className="text-[var(--text-muted)] shrink-0" />
                <span className="text-[var(--text-muted)] truncate">{s.operator}</span>
              </div>
            )}
            {s.usageCost && (
              <div className="flex items-start gap-1.5 col-span-2">
                <Zap size={11} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[var(--text-muted)] leading-tight">{s.usageCost}</span>
              </div>
            )}
          </div>
          {/* Power levels */}
          {s.powerLevels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {s.powerLevels.map((kw) => (
                <span key={kw} className={`text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] ${kwColor(kw)}`}>
                  {kw} kW
                </span>
              ))}
              {s.connectors.map((c) => (
                <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">{c}</span>
              ))}
            </div>
          )}
          {/* Navigate button */}
          <button
            type="button"
            onClick={handleNavigate}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Navigation size={14} />
            Navigation starten
          </button>
        </div>
      )}
    </div>
  );
}


// ─── Radius Selector ─────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [10, 25, 50, 100] as const;
type Radius = (typeof RADIUS_OPTIONS)[number];

function RadiusSelector({ value, onChange }: { value: Radius; onChange: (r: Radius) => void }) {
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

// ─── Feed variants ────────────────────────────────────────────────────────────

function NearestFeed({ stations, loading, locale }: { stations: StationCard[]; loading: boolean; locale: string }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...stations].filter((s) => s.isOperational !== false).sort((a, b) => a.distanceKm - b.distanceKm);
  const visible = showAll ? sorted : sorted.slice(0, 8);
  if (loading) return <FeedSkeleton rows={4} />;
  return (
    <div className="space-y-2">
      {sorted.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center py-6">Keine Stationen gefunden.</p>}
      {visible.map((s, i) => <ExpandableStationRow key={s.id} s={s} rank={i + 1} locale={locale} />)}
      {sorted.length > 8 && (
        <button onClick={() => setShowAll((v) => !v)} className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] py-2 hover:text-[var(--text-base)] transition-colors">
          <ChevronDown size={13} className={`transition-transform ${showAll ? "rotate-180" : ""}`} />
          {showAll ? "Weniger anzeigen" : `${sorted.length - 8} weitere`}
        </button>
      )}
    </div>
  );
}

function FastChargerFeed({ stations, loading, locale }: { stations: StationCard[]; loading: boolean; locale: string }) {
  const [showAll, setShowAll] = useState(false);
  const hpc = stations.filter((s) => s.maxKw >= 50 && s.isOperational !== false).sort((a, b) => b.maxKw - a.maxKw);
  const visible = showAll ? hpc : hpc.slice(0, 5);
  if (loading) return <FeedSkeleton rows={3} />;
  return (
    <div className="space-y-2">
      {hpc.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center py-6">Kein Schnellader in diesem Radius gefunden.</p>}
      {visible.map((s) => <ExpandableStationRow key={s.id} s={s} locale={locale} />)}
      {hpc.length > 5 && (
        <button onClick={() => setShowAll((v) => !v)} className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] py-2 hover:text-[var(--text-base)] transition-colors">
          <ChevronDown size={13} className={`transition-transform ${showAll ? "rotate-180" : ""}`} />
          {showAll ? "Weniger" : `${hpc.length - 5} weitere`}
        </button>
      )}
    </div>
  );
}

function AvailabilityFeed({ stations, loading, locale }: { stations: StationCard[]; loading: boolean; locale: string }) {
  const [showAll, setShowAll] = useState(false);
  const operational = stations.filter((s) => s.isOperational !== false);
  const offline = stations.filter((s) => s.isOperational === false);
  const visible = showAll ? stations : stations.slice(0, 5);
  if (loading) return <FeedSkeleton rows={4} />;
  return (
    <div className="space-y-2">
      {stations.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center py-6">Keine Stationen in diesem Radius gefunden.</p>}
      {stations.length > 0 && (
        <div className="flex gap-3 text-xs mb-3">
          <span className="flex items-center gap-1 text-green-400"><Wifi size={12} /> {operational.length} verfügbar</span>
          {offline.length > 0 && <span className="flex items-center gap-1 text-red-400"><WifiOff size={12} /> {offline.length} offline</span>}
        </div>
      )}
      {visible.map((s) => <ExpandableStationRow key={s.id} s={s} locale={locale} />)}
      {stations.length > 5 && (
        <button onClick={() => setShowAll((v) => !v)} className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] py-2 hover:text-[var(--text-base)] transition-colors">
          <ChevronDown size={13} className={`transition-transform ${showAll ? "rotate-180" : ""}`} />
          {showAll ? "Weniger anzeigen" : `${stations.length - 5} weitere`}
        </button>
      )}
    </div>
  );
}
// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FeedSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse" />
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
  const locale = useLocale();
  const [radius, setRadius] = useState<Radius>(50);
  const [activeTab, setActiveTab] = useState<FeedTab>("nearest");
  const [stations, setStations] = useState<StationCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStations = useCallback(async (lat: number, lng: number, r: number) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng), distance: String(r), maxResults: "120" });
      const res = await fetch(`/api/stations?${params}`, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data: OCMStation[] = await res.json();
      setStations(data.map((s) => toCard(s, lat, lng)));
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") setError("Stationen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setLocation(loc); fetchStations(loc.lat, loc.lng, radius); },
      () => setLocationDenied(true),
      { timeout: 8000 },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (location) fetchStations(location.lat, location.lng, radius); }, [radius]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} className="text-[var(--primary)]" />
          <h2 className="text-sm font-bold text-[var(--text-base)]">{t("nearby_title", { fallback: "In der Nähe" })}</h2>
          {stations.length > 0 && (
            <span className="text-[10px] bg-[var(--primary-light-soft)] text-[var(--primary)] px-2 py-0.5 rounded-full font-semibold">{stations.length}</span>
          )}
        </div>
        <button onClick={() => location && fetchStations(location.lat, location.lng, radius)} disabled={loading || !location} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors disabled:opacity-40" aria-label="Aktualisieren">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="mb-4"><RadiusSelector value={radius} onChange={setRadius} /></div>

      {locationDenied && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 mb-4">
          <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">Standort nicht verfügbar. Bitte Standortzugriff im Browser erlauben.</p>
        </div>
      )}

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {!locationDenied && (
        <>
          <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 text-xs px-3 py-2 border-b-2 transition-colors -mb-px ${activeTab === tab.id ? "border-[var(--primary)] text-[var(--primary)] font-semibold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-base)]"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          {activeTab === "nearest" && <NearestFeed stations={stations} loading={loading} locale={locale} />}
          {activeTab === "fast" && <FastChargerFeed stations={stations} loading={loading} locale={locale} />}
          {activeTab === "availability" && <AvailabilityFeed stations={stations} loading={loading} locale={locale} />}
        </>
      )}
    </div>
  );
}
