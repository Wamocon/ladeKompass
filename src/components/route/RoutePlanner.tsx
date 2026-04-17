"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Navigation, Loader2, Search, ChevronDown, ChevronUp, X, MapPin, Bookmark, BookmarkCheck, Map } from "lucide-react";
import { calculateRoute, saveRoute } from "@/lib/actions/route";
import type { RouteResult, CalculateRouteInput } from "@/lib/actions/route";
import { RouteSummary } from "./RouteSummary";

interface GeoResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface LocationState {
  query: string;
  label: string;
  lat: string;
  lng: string;
  suggestions: GeoResult[];
  loading: boolean;
  showCoords: boolean;
}

const emptyLocation = (): LocationState => ({
  query: "",
  label: "",
  lat: "",
  lng: "",
  suggestions: [],
  loading: false,
  showCoords: false,
});

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

export function RoutePlanner() {
  const t = useTranslations("route");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastInput, setLastInput] = useState<CalculateRouteInput | null>(null);

  const [start, setStart] = useState<LocationState>(emptyLocation());
  const [end, setEnd] = useState<LocationState>(emptyLocation());
  const [vehicle, setVehicle] = useState({
    batteryKwh: "60",
    currentSoc: "80",
    minArrivalSoc: "15",
  });

  const startDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const geocode = useCallback(
    async (q: string, setter: React.Dispatch<React.SetStateAction<LocationState>>) => {
      if (q.length < 3) {
        setter((p) => ({ ...p, suggestions: [], loading: false }));
        return;
      }
      setter((p) => ({ ...p, loading: true }));
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data: GeoResult[] = await res.json();
        setter((p) => ({ ...p, suggestions: data, loading: false }));
      } catch {
        setter((p) => ({ ...p, suggestions: [], loading: false }));
      }
    },
    [],
  );

  function handleQueryChange(
    value: string,
    setter: React.Dispatch<React.SetStateAction<LocationState>>,
    debounceRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  ) {
    setter((p) => ({ ...p, query: value, label: "", lat: "", lng: "" }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => geocode(value, setter), 350);
  }

  function selectSuggestion(
    suggestion: GeoResult,
    setter: React.Dispatch<React.SetStateAction<LocationState>>,
  ) {
    setter((p) => ({
      ...p,
      query: suggestion.display_name,
      label: suggestion.display_name,
      lat: suggestion.lat,
      lng: suggestion.lon,
      suggestions: [],
      loading: false,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSavedId(null);

    const startLat = parseFloat(start.lat);
    const startLng = parseFloat(start.lng);
    const endLat = parseFloat(end.lat);
    const endLng = parseFloat(end.lng);
    const batteryCapacityKwh = parseFloat(vehicle.batteryKwh);
    const currentSocPercent = parseFloat(vehicle.currentSoc);
    const minArrivalSocPercent = parseFloat(vehicle.minArrivalSoc);

    if ([startLat, startLng, endLat, endLng, batteryCapacityKwh, currentSocPercent].some(isNaN)) {
      setError(t("validation_error", { fallback: "Bitte Start und Ziel aus den Vorschlägen wählen oder Koordinaten manuell eingeben." }));
      return;
    }

    const routeInput: CalculateRouteInput = {
      startLat,
      startLng,
      startName: start.label || `${startLat}, ${startLng}`,
      endLat,
      endLng,
      endName: end.label || `${endLat}, ${endLng}`,
      batteryCapacityKwh,
      currentSocPercent,
      minArrivalSocPercent,
    };
    setLastInput(routeInput);

    startTransition(async () => {
      const res = await calculateRoute(routeInput);
      if (res.error === "QUOTA_EXCEEDED") {
        setError(t("quota_exceeded", { fallback: "Routen-Limit dieses Monats erreicht. Upgrade auf Pro für unbegrenzte Routen." }));
      } else {
        setResult(res);
      }
    });
  }

  async function handleSave() {
    if (!result || !lastInput) return;
    setSaving(true);
    const { id, error: saveErr } = await saveRoute({
      name: `${lastInput.startName} → ${lastInput.endName}`,
      result,
      input: lastInput,
    });
    setSaving(false);
    if (!saveErr) setSavedId(id);
  }

  // â”€â”€â”€ Reusable location input block â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function renderLocation(
    legendLabel: string,
    loc: LocationState,
    setter: React.Dispatch<React.SetStateAction<LocationState>>,
    debounceRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  ) {
    const isResolved = !!(loc.lat && loc.lng);
    return (
      <fieldset className="space-y-2">
        <legend className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          {legendLabel}
        </legend>

        {/* Address search */}
        <div className="relative">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
              isResolved
                ? "border-[var(--primary)] bg-[var(--bg-elevated)]"
                : "border-[var(--border)] bg-[var(--bg-elevated)]"
            }`}
          >
            {loc.loading ? (
              <Loader2 size={14} className="text-[var(--text-muted)] animate-spin shrink-0" />
            ) : isResolved ? (
              <MapPin size={14} className="text-[var(--primary)] shrink-0" />
            ) : (
              <Search size={14} className="text-[var(--text-muted)] shrink-0" />
            )}
            <input
              type="text"
              value={loc.query}
              onChange={(e) => handleQueryChange(e.target.value, setter, debounceRef)}
              placeholder="Straße + Nr., Stadt oder PLZ eingeben…"
              className="flex-1 bg-transparent text-sm text-[var(--text-base)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
            {loc.query && (
              <button
                type="button"
                onClick={() => setter(emptyLocation())}
                className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {loc.suggestions.length > 0 && (
            <ul className="absolute z-20 top-full mt-1 w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
              {loc.suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(s, setter)}
                    className="w-full text-left px-3 py-2.5 text-sm text-[var(--text-base)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <span className="font-medium">
                      {s.display_name.split(",")[0]}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] ml-1">
                      {s.display_name.split(",").slice(1, 3).join(",")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Optional coordinates toggle */}
        <button
          type="button"
          onClick={() => setter((p) => ({ ...p, showCoords: !p.showCoords }))}
          className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors"
        >
          {loc.showCoords ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          Koordinaten manuell eingeben (optional)
        </button>

        {loc.showCoords && (
          <div className="grid grid-cols-2 gap-2">
            <input
              value={loc.lat}
              onChange={(e) => setter((p) => ({ ...p, lat: e.target.value }))}
              placeholder="Breitengrad (z.B. 52.520)"
              type="number"
              step="any"
              className={inputCls}
            />
            <input
              value={loc.lng}
              onChange={(e) => setter((p) => ({ ...p, lng: e.target.value }))}
              placeholder="Längengrad (z.B. 13.405)"
              type="number"
              step="any"
              className={inputCls}
            />
          </div>
        )}
      </fieldset>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {renderLocation(t("start", { fallback: "Startpunkt" }), start, setStart, startDebounce)}
        {renderLocation(t("destination", { fallback: "Ziel" }), end, setEnd, endDebounce)}

        {/* Vehicle */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {t("vehicle_params", { fallback: "Fahrzeugparameter" })}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                {t("battery_kwh", { fallback: "Akku (kWh)" })}
              </label>
              <input
                value={vehicle.batteryKwh}
                onChange={(e) => setVehicle((p) => ({ ...p, batteryKwh: e.target.value }))}
                type="number" min="10" max="200" step="0.5" required
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                {t("current_soc", { fallback: "Aktueller SoC %" })}
              </label>
              <input
                value={vehicle.currentSoc}
                onChange={(e) => setVehicle((p) => ({ ...p, currentSoc: e.target.value }))}
                type="number" min="5" max="100" required
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                {t("min_arrival_soc", { fallback: "Min. Ankunft %" })}
              </label>
              <input
                value={vehicle.minArrivalSoc}
                onChange={(e) => setVehicle((p) => ({ ...p, minArrivalSoc: e.target.value }))}
                type="number" min="5" max="50" required
                className={inputCls}
              />
            </div>
          </div>
        </fieldset>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || !start.lat || !start.lng || !end.lat || !end.lng}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-bold py-3 px-4 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          {t("calculate", { fallback: "Route berechnen" })}
        </button>
      </form>

      {result && (
        <div className="mt-4 space-y-3">
          <RouteSummary result={result} />
          <div className="flex items-center gap-2">
            {savedId ? (
              <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
                <BookmarkCheck size={15} />
                {t("saved", { fallback: "Route gespeichert" })}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Bookmark size={13} />}
                {t("save_route", { fallback: "Route speichern" })}
              </button>
            )}
            <a
              href="../route/archive"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors underline"
            >
              {t("view_archive", { fallback: "Archiv anzeigen →" })}
            </a>
            {lastInput && (
              <button
                type="button"
                onClick={() => {
                  const inp = lastInput;
                  if (!inp) return;
                  const preset = {
                    fromLabel: inp.startName,
                    toLabel: inp.endName,
                    fromCoord: [inp.startLat, inp.startLng],
                    toCoord: [inp.endLat, inp.endLng],
                  };
                  localStorage.setItem("lk_nav_preset", JSON.stringify(preset));
                  window.location.href = `/${window.location.pathname.split("/")[1]}/map`;
                }}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Map size={12} />
                {t("use_in_nav", { fallback: "Navigation starten" })}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

