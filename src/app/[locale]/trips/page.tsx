"use client";

import { useEffect, useState } from "react";
import {
  Navigation, MapPin, Clock, Zap, Trash2, ChevronDown, ChevronUp,
  BatteryCharging, CalendarDays, Route,
} from "lucide-react";
import Link from "next/link";

interface ChargingStop {
  name?: string;
  distanceFromStartM?: number;
  powerKw?: number;
  estimatedChargingMinutes?: number;
}

interface Trip {
  id: string;
  started_at: string;
  ended_at: string | null;
  from_label: string | null;
  to_label: string | null;
  distance_m: number | null;
  duration_s: number | null;
  charging_stops: ChargingStop[];
  created_at: string;
}

function fmtDist(m: number | null) {
  if (!m) return "–";
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function fmtDuration(s: number | null) {
  if (!s) return "–";
  const min = Math.round(s / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}m`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const stops = trip.charging_stops ?? [];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
          <Navigation size={16} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text-base)] truncate">
            {trip.from_label ?? "Unbekannter Start"} → {trip.to_label ?? "Unbekanntes Ziel"}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <CalendarDays size={11} />
            {fmtDate(trip.started_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(trip.id)}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-400 transition-colors"
            title="Fahrt löschen"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 px-4 pb-3 border-b border-[var(--border)]">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)]">
          <Route size={12} />
          {fmtDist(trip.distance_m)}
        </span>
        <span className="text-[var(--text-muted)] text-xs">·</span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Clock size={12} />
          {fmtDuration(trip.duration_s)}
        </span>
        {stops.length > 0 && (
          <>
            <span className="text-[var(--text-muted)] text-xs">·</span>
            <span className="flex items-center gap-1.5 text-xs text-orange-500">
              <BatteryCharging size={12} />
              {stops.length} Ladestopp{stops.length > 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 py-3 space-y-3 bg-[var(--bg-elevated)]">
          {/* Route detail */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-xs">
              <MapPin size={12} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-[var(--text-base)]">{trip.from_label ?? "–"}</span>
            </div>
            <div className="ml-3 border-l-2 border-dashed border-[var(--border)] h-3" />
            <div className="flex items-start gap-2 text-xs">
              <MapPin size={12} className="text-red-500 shrink-0 mt-0.5" />
              <span className="text-[var(--text-base)]">{trip.to_label ?? "–"}</span>
            </div>
          </div>

          {/* Charging stops */}
          {stops.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Ladestopps
              </p>
              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-orange-50 dark:bg-orange-900/10 rounded-lg px-3 py-2">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">{i + 1}</span>
                  <Zap size={11} className="text-orange-500 shrink-0" />
                  <span className="flex-1 text-[var(--text-base)] truncate">{stop.name ?? "Ladesäule"}</span>
                  {stop.powerKw && (
                    <span className="text-orange-500 font-bold shrink-0">{stop.powerKw} kW</span>
                  )}
                  {stop.estimatedChargingMinutes && (
                    <span className="text-[var(--text-muted)] shrink-0">~{stop.estimatedChargingMinutes} min</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Timestamps */}
          <div className="text-[10px] text-[var(--text-muted)] border-t border-[var(--border)] pt-2">
            {trip.ended_at && (
              <span>Angekommen: {fmtDate(trip.ended_at)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trips")
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Bitte anmelden um dein Fahrtenarchiv zu sehen." : "Fehler beim Laden.");
        return r.json();
      })
      .then((data: Trip[]) => { setTrips(data); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, []);

  async function deleteTrip(id: string) {
    if (!confirm("Diese Fahrt wirklich löschen?")) return;
    setTrips((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/trips?id=${id}`, { method: "DELETE" });
  }

  const totalDist = trips.reduce((s, t) => s + (t.distance_m ?? 0), 0);
  const totalTime = trips.reduce((s, t) => s + (t.duration_s ?? 0), 0);
  const totalStops = trips.reduce((s, t) => s + (t.charging_stops?.length ?? 0), 0);

  return (
    <div className="min-h-mobile-nav bg-[var(--bg-page)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-surface)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center">
            <Navigation size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--text-base)]">Fahrtenarchiv</h1>
            <p className="text-xs text-[var(--text-muted)]">{trips.length} gespeicherte Fahrten</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Stats summary */}
        {trips.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Gesamt gefahren", value: fmtDist(totalDist), icon: <Route size={16} className="text-green-500" /> },
              { label: "Fahrzeit gesamt", value: fmtDuration(totalTime), icon: <Clock size={16} className="text-blue-500" /> },
              { label: "Ladestopps", value: String(totalStops), icon: <BatteryCharging size={16} className="text-orange-500" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl px-3 py-3 text-center">
                <div className="flex justify-center mb-1">{icon}</div>
                <p className="text-base font-black text-[var(--text-base)]">{value}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">Wird geladen…</div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-4 text-sm text-red-600 dark:text-red-400">
            {error}{" "}
            {error.includes("anmelden") && (
              <Link href="/auth/login" className="underline font-semibold">Jetzt anmelden →</Link>
            )}
          </div>
        )}

        {!loading && !error && trips.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <Navigation size={28} className="text-green-500" />
            </div>
            <p className="text-sm font-semibold text-[var(--text-base)]">Noch keine Fahrten</p>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
              Starte eine Navigation auf der Karte — jede abgeschlossene Fahrt wird hier gespeichert.
            </p>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              <Navigation size={14} /> Zur Karte
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
          ))}
        </div>
      </div>
    </div>
  );
}
