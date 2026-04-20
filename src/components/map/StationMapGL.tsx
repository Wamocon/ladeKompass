"use client";

import { useEffect, useRef, useCallback, Dispatch } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StationFiltersState } from "./StationFilters";
import type { OCMStation } from "@/app/api/stations/route";
import type { PlannedChargingStop } from "@/lib/charging-stops";
import {
  ALL_PIN_TYPES,
  getEvPinSvg,
  getStationPinType,
  type PinType,
} from "@/lib/map-icons";

// ─── Canvas-based SVG → ImageData ─────────────────────────────────────────────
// MapLibre GL v5 uses fetch() internally for loadImage(), which cannot decode
// SVG data: URLs. We render at 4× resolution so MapLibre can use pixelRatio:4,
// keeping icons crisp at all zoom levels without any rasterisation blur.
const PIN_PIXEL_RATIO = 4;
const PIN_LOGICAL_W   = 36;
const PIN_LOGICAL_H   = 46;

function loadSvgPinImage(svgString: string): Promise<ImageData> {
  const physW = PIN_LOGICAL_W * PIN_PIXEL_RATIO;
  const physH = PIN_LOGICAL_H * PIN_PIXEL_RATIO;
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width  = physW;
    canvas.height = physH;
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("Canvas 2D not available")); return; }
    const img = new Image(physW, physH);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, physW, physH);
      resolve(ctx.getImageData(0, 0, physW, physH));
    };
    img.onerror = () => reject(new Error("SVG pin render failed"));
    // Embed explicit width/height in the SVG so the browser renders at full size
    const sized = svgString.replace(
      /(<svg[^>]*)\bwidth="[^"]*"\s*height="[^"]*"/,
      `$1width="${physW}" height="${physH}"`,
    );
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
  });
}

export type MapStyle = "light" | "dark" | "bright" | "standard";

// --- Free tile style URLs (no API key required) ----------------------------
// OpenFreeMap public styles — no key needed
const STYLE_URLS: Record<MapStyle, string> = {
  light:    "https://tiles.openfreemap.org/styles/positron",
  dark:     "https://tiles.openfreemap.org/styles/dark-matter",
  bright:   "https://tiles.openfreemap.org/styles/bright",
  standard: "https://tiles.openfreemap.org/styles/liberty",
};

// CSS for pulsing user-location dot (injected once)
const PULSE_CSS = `
@keyframes pulse-ring {
  0%   { transform: scale(1);   opacity: 0.8; }
  100% { transform: scale(2.4); opacity: 0; }
}
.user-location-outer {
  position: relative;
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
}
.user-location-outer::before {
  content: '';
  position: absolute;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: rgba(59,130,246,0.4);
  animation: pulse-ring 1.5s ease-out infinite;
}
.user-location-dot {
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2.5px solid #fff;
  box-shadow: 0 0 6px rgba(59,130,246,0.8);
  z-index: 1;
  position: relative;
}
.maplibregl-popup-content {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}
.maplibregl-popup-tip { display: none !important; }
.nav-car-marker {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #2563eb;
  border: 3px solid #fff;
  box-shadow: 0 0 0 4px rgba(37,99,235,0.3), 0 2px 12px rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.3s ease;
}
.nav-car-arrow {
  width: 0; height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 12px solid white;
  margin-bottom: 2px;
}
@keyframes lk-spin {
  to { transform: rotate(360deg); }
}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = PULSE_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

// --- Power-aware neon colour helpers ----------------------------------------
function maxKw(station: OCMStation): number {
  const kws = (station.Connections ?? [])
    .map((c) => Number(c.PowerKW ?? 0))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return kws.length ? Math.max(0, ...kws) : 0;
}

function stationColor(station: OCMStation): string {
  if (station.StatusType?.IsOperational === false) return "#ff4757";  // vivid red  – offline
  const kw = maxKw(station);
  if (kw >= 150) return "#00ff88"; // neon green  – HPC / ultra-fast
  if (kw >= 50)  return "#00e5ff"; // neon cyan   – DC fast
  if (kw >= 22)  return "#a78bfa"; // violet      – DC semi-fast
  if (kw > 0)    return "#4ade80"; // green       – AC
  return "#fbbf24";                // amber       – unknown
}

function stationGlowColor(station: OCMStation): string {
  if (station.StatusType?.IsOperational === false) return "rgba(255,71,87,0.55)";
  const kw = maxKw(station);
  if (kw >= 150) return "rgba(0,255,136,0.55)";
  if (kw >= 50)  return "rgba(0,229,255,0.55)";
  if (kw >= 22)  return "rgba(167,139,250,0.55)";
  if (kw > 0)    return "rgba(74,222,128,0.45)";
  return "rgba(251,191,36,0.45)";
}

function stationsToGeoJSON(stations: OCMStation[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [s.AddressInfo.Longitude, s.AddressInfo.Latitude],
      },
      properties: {
        id:        s.ID,
        uuid:      s.UUID,
        title:     s.AddressInfo.Title,
        town:      s.AddressInfo.Town ?? "",
        postcode:  s.AddressInfo.Postcode ?? "",
        maxKw:     maxKw(s),
        color:     stationColor(s),
        glowColor: stationGlowColor(s),
        pinType:   `ev-pin-${getStationPinType(maxKw(s), s.StatusType?.IsOperational ?? null)}`,
        operator:  s.OperatorInfo?.Title ?? "",
        isOpen247: s.OpeningTimes?.IsOpen247 ?? false,
        dataProviderId: (s as OCMStation & { DataProvider?: { ID: number } }).DataProvider?.ID ?? 0,
      },
    })),
  };
}

// --- Props ------------------------------------------------------------------
export interface StationMapGLProps {
  defaultCenter: [number, number]; // [lat, lng]
  filters: StationFiltersState;
  flyToCenter: [number, number] | null;
  userLocation: [number, number] | null;
  mapStyle: MapStyle;
  show3D: boolean;
  showHeatmap: boolean;
  onStationsChange?: Dispatch<React.SetStateAction<OCMStation[]>>;
  onStationSelect?: (station: OCMStation | null) => void;
  selectedStation?: OCMStation | null;
  /** GeoJSON route to draw on map (from OSRM or similar) */
  routeGeoJSON?: GeoJSON.FeatureCollection | null;
  /** Live nav position [lat, lng, bearing-degrees]. When set, map follows + shows arrow. */
  navPosition?: [number, number, number] | null;
  /** Device compass/GPS heading in degrees (0=North). Used to rotate the user location dot. */
  userHeading?: number | null;
  /** Called when user clicks Navigate-to-station in popup */
  onNavigateTo?: (lat: number, lng: number, label: string) => void;
  /** Planned charging stops along the current route */
  chargingStops?: PlannedChargingStop[];
}

const SOURCE_ID           = "stations";
const CLUSTER_LAYER       = "clusters";
const CLUSTER_COUNT_LAYER = "cluster-count";
const POINT_GLOW_LAYER    = "unclustered-glow";
const POINT_LAYER         = "unclustered-point";
const HEATMAP_LAYER       = "heatmap";
const BUILDINGS_LAYER     = "3d-buildings";

export function StationMapGL({
  defaultCenter,
  filters,
  flyToCenter,
  userLocation,
  mapStyle,
  show3D,
  showHeatmap,
  onStationsChange,
  onStationSelect,
  selectedStation,
  routeGeoJSON,
  navPosition,
  userHeading,
  onNavigateTo,
  chargingStops,
}: StationMapGLProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<maplibregl.Map | null>(null);
  const markerRef     = useRef<maplibregl.Marker | null>(null); // user location
  const navMarkerRef  = useRef<maplibregl.Marker | null>(null); // nav car
  const chargingMarkersRef = useRef<maplibregl.Marker[]>([]);   // charging stop pins
  const popupRef      = useRef<maplibregl.Popup | null>(null);  // station popup
  const stationsRef  = useRef<OCMStation[]>([]);
  const abortRef     = useRef<AbortController | null>(null);
  const fetchTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialised  = useRef(false);
  // Stores latest route data so it can be applied after style changes
  const pendingRouteRef = useRef<GeoJSON.FeatureCollection | null>(null);

  // Inject animation CSS once
  useEffect(() => { injectCSS(); }, []);

  // --- Fetch stations from our OCM proxy ------------------------------------
  const fetchStations = useCallback(
    (lat: number, lng: number) => {
      if (fetchTimer.current) clearTimeout(fetchTimer.current);
      fetchTimer.current = setTimeout(async () => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const params = new URLSearchParams({
          lat:        String(lat),
          lng:        String(lng),
          distance:   "30",
          maxResults: "120",
        });
        if (filters.powerLevel === "dc")  params.set("powerLevel", "dc");
        if (filters.powerLevel === "hpc") params.set("powerLevel", "hpc");
        if (filters.connectorType)        params.set("connectorType", filters.connectorType);

        try {
          const res = await fetch(`/api/stations?${params}`, {
            signal: abortRef.current.signal,
          });
          if (!res.ok) return;
          const data: OCMStation[] = await res.json();
          stationsRef.current = data;
          onStationsChange?.((prev) => (JSON.stringify(prev.map(s => s.ID)) === JSON.stringify(data.map(s => s.ID)) ? prev : data));

          const map = mapRef.current;
          if (!map || !map.getSource(SOURCE_ID)) return;
          (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).setData(
            stationsToGeoJSON(data),
          );
        } catch {
          // aborted or network error – ignore
        }
      }, 500);
    },
    [filters, onStationsChange],
  );

  // --- Initialise map once -------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || initialised.current) return;
    initialised.current = true;

    const [lat, lng] = defaultCenter;
    const map = new maplibregl.Map({
      container:        containerRef.current,
      style:            STYLE_URLS[mapStyle],
      center:           [lng, lat],
      zoom:             6,
      // Use system fonts for ideographic (CJK) characters.
      localIdeographFontFamily: "sans-serif",
      // OpenFreeMap's glyph server returns HTML (not PBF) for the fonts used
      // in their tile styles → MapLibre protobuf parser throws "Unimplemented
      // type: 4" (HTML '<' byte = 0x3C = protobuf wire type 4). Fix: redirect
      // ALL Glyph requests to MapLibre's own demo font server which returns
      // valid PBF binary for MapLibre GL v5. Also strip fallback font-stack
      // entries (comma-separated) so only the primary font is requested.
      transformRequest: (url: string, resourceType?: maplibregl.ResourceType) => {
        if (resourceType === "Glyphs") {
          // Match both /font/ and /fonts/ path styles
          const m = url.match(/\/fonts?\/([^/]+)(\/\d+-\d+\.pbf.*)$/);
          if (m) {
            const primary = decodeURIComponent(m[1]).split(",")[0].trim();
            return {
              url: `https://demotiles.maplibre.org/font/${encodeURIComponent(primary)}${m[2]}`,
            };
          }
        }
        return { url };
      },
    });

    mapRef.current = map;

    // --- Load EV pin icons on demand (canvas-based; SVG data: URLs cannot be
    // decoded by MapLibre GL v5's internal loadImage / fetch pipeline) ----------
    map.on("styleimagemissing", (e: { id: string }) => {
      if (!e.id.startsWith("ev-pin-")) return;
      const type = e.id.replace("ev-pin-", "") as PinType;
      if (!ALL_PIN_TYPES.includes(type)) return;
      void loadSvgPinImage(getEvPinSvg(type)).then((imageData) => {
        if (!map.hasImage(e.id)) map.addImage(e.id, imageData, { pixelRatio: PIN_PIXEL_RATIO, sdf: false });
      }).catch(() => { /* ignore individual render failures */ });
    });

    // Custom zoom controls (top-right)
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
    }), "top-right");

    map.on("load", () => {
      // --- GeoJSON source with native clustering ----------------------------
      map.addSource(SOURCE_ID, {
        type:             "geojson",
        data:             { type: "FeatureCollection", features: [] },
        cluster:          true,
        clusterMaxZoom:   13,
        clusterRadius:    50,
      });

      // Cluster circle — neon gradient + glow stroke
      map.addLayer({
        id:     CLUSTER_LAYER,
        type:   "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color":        ["step", ["get", "point_count"], "#00ff88", 10, "#fbbf24", 50, "#ff4757"],
          "circle-radius":       ["step", ["get", "point_count"], 20, 10, 28, 50, 36],
          "circle-stroke-width": 4,
          "circle-stroke-color": ["step", ["get", "point_count"], "#00cc6a", 10, "#f59e0b", 50, "#ff4757"],
          "circle-opacity":      1.0,
        },
      });

      // Cluster count label
      // No "text-font" override — inherit from tile style to avoid 404s for
      // font stacks that aren't hosted on the OpenFreeMap glyph server.
      map.addLayer({
        id:     CLUSTER_COUNT_LAYER,
        type:   "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field":  ["get", "point_count_abbreviated"],
          "text-size":   13,
        },
        paint: { "text-color": "#fff" },
      });

      // Glow halo behind individual station dots
      map.addLayer({
        id:     POINT_GLOW_LAYER,
        type:   "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color":        ["get", "color"],
          "circle-radius":       ["interpolate", ["linear"], ["get", "maxKw"], 0, 12, 50, 16, 150, 22],
          "circle-opacity":      0.40,
          "circle-blur":         1.2,
          "circle-stroke-width": 0,
        },
      });

      map.addLayer({
        id:     POINT_LAYER,
        type:   "symbol",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image":         ["get", "pinType"],
          // Scale icons with zoom level so they remain readable when zoomed in
          "icon-size":          [
            "interpolate", ["exponential", 1.4], ["zoom"],
            9,  ["interpolate", ["linear"], ["get", "maxKw"], 0, 0.55, 50, 0.70, 150, 0.90],
            12, ["interpolate", ["linear"], ["get", "maxKw"], 0, 0.90, 50, 1.10, 150, 1.40],
            15, ["interpolate", ["linear"], ["get", "maxKw"], 0, 1.40, 50, 1.70, 150, 2.10],
            18, ["interpolate", ["linear"], ["get", "maxKw"], 0, 1.90, 50, 2.30, 150, 2.80],
          ],
          "icon-allow-overlap": true,
          "icon-anchor":        "bottom",
        },
      });

      // Heatmap layer (initially hidden)
      map.addLayer({
        id:     HEATMAP_LAYER,
        type:   "heatmap",
        source: SOURCE_ID,
        layout: { visibility: "none" },
        paint: {
          "heatmap-weight":              ["interpolate", ["linear"], ["get", "maxKw"], 0, 0, 350, 1],
          "heatmap-intensity":           ["interpolate", ["linear"], ["zoom"], 0, 1, 14, 3],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,255,0)",
            0.2, "royalblue",
            0.4, "cyan",
            0.6, "lime",
            0.8, "yellow",
            1,   "red",
          ],
          "heatmap-radius":   ["interpolate", ["linear"], ["zoom"], 0, 2, 14, 30],
          "heatmap-opacity":  ["interpolate", ["linear"], ["zoom"], 7, 0.8, 14, 0.3],
        },
      });

      // Route line source + layer (initially empty, for OSRM navigation)
      // lineMetrics: true is REQUIRED for line-gradient to work
      map.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        lineMetrics: true,
      });
      map.addLayer({
        id: "route-line-outline",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color":   "#1e3a5f",
          "line-width":   10,
          "line-opacity": 0.5,
        },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color":  "#3b82f6",
          "line-width":  6,
          "line-opacity": 1,
        },
      });

      // Apply any route that arrived before the map finished loading
      if (pendingRouteRef.current) {
        (map.getSource("route") as maplibregl.GeoJSONSource)
          .setData(pendingRouteRef.current);
      }

      // Fetch initial data
      fetchStations(lat, lng);
    });

    // Re-fetch on map move
    map.on("moveend", () => {
      const { lat, lng } = map.getCenter();
      fetchStations(lat, lng);
    });

    // Click cluster → zoom in
    map.on("click", CLUSTER_LAYER, (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER] });
      const feature = features[0];
      if (!feature) return;
      const clusterId = feature.properties.cluster_id as number;
      void (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource)
        .getClusterExpansionZoom(clusterId)
        .then((zoom) => {
          const geom = feature.geometry as GeoJSON.Point;
          map.easeTo({ center: geom.coordinates as [number, number], zoom });
        })
        .catch(() => {});
    });

    // Click individual station → popup + select (async: loads prices)
    map.on("click", POINT_LAYER, (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const stationId = feature.properties?.id as number;
      const found = stationsRef.current.find((s) => s.ID === stationId) ?? null;
      onStationSelect?.(found);

      if (!found) return;
      if (popupRef.current) popupRef.current.remove();

      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
      const bgColor = isDark ? "rgba(8,8,18,0.97)" : "rgba(255,255,255,0.97)";
      const textColor = isDark ? "#fff" : "#0f172a";
      const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "#475569";
      const subduedColor = isDark ? "rgba(255,255,255,0.28)" : "#94a3b8";
      const borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
      const sectionBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
      const rowBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
      const shadowColor = isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.2)";
      const statusGreenBg = isDark ? "rgba(0,255,136,0.15)" : "rgba(22,163,74,0.12)";
      const statusGreenText = isDark ? "#00ff88" : "#15803d";
      const statusGreenBorder = isDark ? "rgba(0,255,136,0.3)" : "rgba(22,163,74,0.3)";
      const statusRedBg = isDark ? "rgba(255,71,87,0.15)" : "rgba(220,38,38,0.10)";
      const statusRedText = isDark ? "#ff4757" : "#dc2626";
      const statusRedBorder = isDark ? "rgba(255,71,87,0.3)" : "rgba(220,38,38,0.25)";
      const statusAmberBg = isDark ? "rgba(251,191,36,0.15)" : "rgba(217,119,6,0.12)";
      const statusAmberText = isDark ? "#fbbf24" : "#b45309";
      const statusAmberBorder = isDark ? "rgba(251,191,36,0.3)" : "rgba(217,119,6,0.3)";
      const linkColor = isDark ? "#60a5fa" : "#2563eb";
      const priceColor = isDark ? "#fbbf24" : "#d97706";
      const connTypeColor = isDark ? "rgba(255,255,255,0.65)" : "#475569";

      const kw = maxKw(found);
      const col = stationColor(found);
      const isOp = found.StatusType?.IsOperational;

      const statusBadge = isOp === true
        ? `<span style="background:${statusGreenBg};color:${statusGreenText};border:1px solid ${statusGreenBorder};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">✓ Verfügbar</span>`
        : isOp === false
        ? `<span style="background:${statusRedBg};color:${statusRedText};border:1px solid ${statusRedBorder};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">✗ Außer Betrieb</span>`
        : `<span style="background:${statusAmberBg};color:${statusAmberText};border:1px solid ${statusAmberBorder};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">? Status unbekannt</span>`;
      const powerLabel = kw >= 150 ? "HPC Ultra-Schnell" : kw >= 50 ? "DC Schnell" : kw >= 22 ? "DC" : kw > 0 ? "AC Normal" : "";

      // Connector rows grouped by type+power
      const connRows = (found.Connections ?? []).map(c => {
        const type = c.ConnectionType?.Title ?? "Unbekannt";
        const pw = c.PowerKW ? `${c.PowerKW} kW` : "–";
        const qty = c.Quantity ? ` ×${c.Quantity}` : "";
        const pwColor = (c.PowerKW ?? 0) >= 150 ? (isDark ? "#c084fc" : "#7c3aed") : (c.PowerKW ?? 0) >= 22 ? (isDark ? "#60a5fa" : "#2563eb") : mutedColor;
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid ${rowBorder};">
          <span style="color:${connTypeColor};font-size:12px;">${type}${qty}</span>
          <span style="color:${pwColor};font-weight:700;font-size:13px;">${pw}</span>
        </div>`;
      }).join("");

      // Opening / access
      const hours = found.OpeningTimes?.IsOpen247
        ? `<div style="font-size:12px;color:#16a34a;margin-top:6px;">🕐 24/7 geöffnet</div>`
        : "";
      const access = found.AddressInfo.AccessComments
        ? `<div style="font-size:11px;color:${subduedColor};margin-top:5px;font-style:italic;">${found.AddressInfo.AccessComments}</div>`
        : "";

      // Unique price container
      const priceId = `lk-price-${found.ID}`;
      const chargepriceUrl = `https://www.chargeprice.app/?station=${found.UUID}&source=ocm`;

      // encodeURIComponent produces only %XX sequences — no JS special chars, immune to escaping attacks
      const _navTitle = encodeURIComponent(found.AddressInfo.Title);
      const _cTitle = encodeURIComponent(found.AddressInfo.Title);
      const navBtn = `<button onclick="window.__lkNav&&window.__lkNav(${found.AddressInfo.Latitude},${found.AddressInfo.Longitude},decodeURIComponent('${_navTitle}'));var _p=this.closest('.maplibregl-popup');if(_p)_p.remove();" style="flex:1;padding:11px;background:#2563eb;border:none;border-radius:12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">▶ Navigation starten</button>`;

      // Community comment form (inline, toggled by button)
      const commentFormId = `lk-comments-${found.ID}`;
      const commentTextId = `lk-comment-text-${found.ID}`;
      const commentStatusId = `lk-comment-status-${found.ID}`;
      const commentFormHtml = `
        <div style="margin-top:8px;">
          <button onclick="var f=document.getElementById('${commentFormId}');f.style.display=f.style.display==='none'?'block':'none';" style="width:100%;padding:9px;background:${sectionBg};border:1px solid ${borderColor};border-radius:12px;color:${mutedColor};font-size:12px;font-weight:600;cursor:pointer;text-align:left;">💬 Community-Kommentar hinterlassen</button>
          <div id="${commentFormId}" style="display:none;margin-top:8px;padding:12px;background:${sectionBg};border:1px solid ${borderColor};border-radius:12px;">
            <p style="font-size:11px;color:${subduedColor};margin:0 0 8px 0;">Status oder Kommentar:</p>
            <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">
              <button onclick="window.__lkComment&&window.__lkComment('${found.ID}',decodeURIComponent('${_cTitle}'),'available',document.getElementById('${commentTextId}').value,${found.AddressInfo.Latitude},${found.AddressInfo.Longitude},document.getElementById('${commentStatusId}'))" style="padding:4px 10px;border-radius:20px;border:1px solid #16a34a;color:#16a34a;background:transparent;font-size:11px;font-weight:600;cursor:pointer;">✓ Verfügbar</button>
              <button onclick="window.__lkComment&&window.__lkComment('${found.ID}',decodeURIComponent('${_cTitle}'),'occupied',document.getElementById('${commentTextId}').value,${found.AddressInfo.Latitude},${found.AddressInfo.Longitude},document.getElementById('${commentStatusId}'))" style="padding:4px 10px;border-radius:20px;border:1px solid #d97706;color:#d97706;background:transparent;font-size:11px;font-weight:600;cursor:pointer;">⏳ Belegt</button>
              <button onclick="window.__lkComment&&window.__lkComment('${found.ID}',decodeURIComponent('${_cTitle}'),'defect',document.getElementById('${commentTextId}').value,${found.AddressInfo.Latitude},${found.AddressInfo.Longitude},document.getElementById('${commentStatusId}'))" style="padding:4px 10px;border-radius:20px;border:1px solid #dc2626;color:#dc2626;background:transparent;font-size:11px;font-weight:600;cursor:pointer;">✗ Defekt</button>
              <button onclick="window.__lkComment&&window.__lkComment('${found.ID}',decodeURIComponent('${_cTitle}'),'comment',document.getElementById('${commentTextId}').value,${found.AddressInfo.Latitude},${found.AddressInfo.Longitude},document.getElementById('${commentStatusId}'))" style="padding:4px 10px;border-radius:20px;border:1px solid ${borderColor};color:${mutedColor};background:transparent;font-size:11px;font-weight:600;cursor:pointer;">📌 Info</button>
            </div>
            <textarea id="${commentTextId}" placeholder="Kommentar (optional, max. 300 Zeichen)" maxlength="300" rows="2" style="width:100%;padding:8px;border:1px solid ${borderColor};border-radius:8px;font-size:12px;background:${isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"};color:${textColor};resize:none;box-sizing:border-box;outline:none;"></textarea>
            <div id="${commentStatusId}" style="font-size:11px;margin-top:4px;color:${mutedColor};min-height:16px;"></div>
          </div>
        </div>`;

      const html = `<div style="
        background:${bgColor};backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
        border:1px solid ${borderColor};border-radius:20px;padding:24px;color:${textColor};
        font-family:system-ui,sans-serif;min-width:min(580px,90vw);max-width:min(680px,94vw);
        box-shadow:0 24px 80px ${shadowColor};">

        <div style="font-weight:800;font-size:16px;margin-bottom:3px;line-height:1.3;color:${textColor};">${found.AddressInfo.Title}</div>
        <div style="font-size:12px;color:${mutedColor};margin-bottom:12px;">${[found.AddressInfo.AddressLine1,found.AddressInfo.Postcode,found.AddressInfo.Town].filter(Boolean).join(", ")}</div>

        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          ${statusBadge}
          ${kw > 0 ? `<span style="font-size:14px;font-weight:800;color:${col};">⚡ ${kw} kW</span><span style="font-size:11px;color:${subduedColor};">&nbsp;${powerLabel}</span>` : ""}
        </div>

        ${found.NumberOfPoints ? `<div style="font-size:12px;color:${mutedColor};margin-bottom:10px;">🔌 ${found.NumberOfPoints} Ladepunkt${(found.NumberOfPoints ?? 0) > 1 ? "e" : ""}</div>` : ""}

        ${connRows ? `<div style="border-top:1px solid ${borderColor};padding-top:10px;margin-bottom:10px;">${connRows}</div>` : ""}

        <!-- PREISE (async) -->
        <div id="${priceId}" style="margin-top:2px;padding:12px;background:${sectionBg};border-radius:12px;border:1px solid ${borderColor};">
          <div style="font-size:11px;color:${subduedColor};text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;">💰 Preise</div>
          <div style="font-size:12px;color:${subduedColor};display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:12px;height:12px;border:2px solid ${borderColor};border-top-color:#60a5fa;border-radius:50%;animation:lk-spin 0.8s linear infinite;"></span>
            Preise werden geladen…
          </div>
        </div>

        ${hours}${access}

        ${found.OperatorInfo?.Title ? `<div style="font-size:11px;color:${subduedColor};margin-top:10px;border-top:1px solid ${borderColor};padding-top:10px;">Betreiber: <span style="color:${mutedColor};">${found.OperatorInfo.Title}</span>${found.OperatorInfo.WebsiteURL ? ` · <a href="${found.OperatorInfo.WebsiteURL}" target="_blank" rel="noopener" style="color:${linkColor};">Website</a>` : ""}</div>` : ""}

        <div style="display:flex;gap:8px;margin-top:12px;">
          ${navBtn}
          <a href="${chargepriceUrl}" target="_blank" rel="noopener" style="flex:0;white-space:nowrap;display:flex;align-items:center;justify-content:center;padding:11px 12px;background:${sectionBg};border:1px solid ${borderColor};border-radius:12px;color:#a3e635;font-size:12px;font-weight:700;text-decoration:none;">Alle Tarife →</a>
        </div>

        ${commentFormHtml}
      </div>`;

      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        maxWidth: "none",
        offset: 14,
      })
        .setLngLat([found.AddressInfo.Longitude, found.AddressInfo.Latitude])
        .setHTML(html)
        .addTo(map);

      map.easeTo({
        center: [found.AddressInfo.Longitude, found.AddressInfo.Latitude],
        zoom: Math.max(map.getZoom(), 14),
        duration: 400,
      });

      // Async: fetch structured price data and update the placeholder
      const priceParams = new URLSearchParams({
        stationId: found.UUID ?? String(found.ID),
        lat: String(found.AddressInfo.Latitude),
        lng: String(found.AddressInfo.Longitude),
      });
      if (found.UsageCost) priceParams.set("usageCost", found.UsageCost);
      if (found.OperatorInfo?.Title) priceParams.set("operator", found.OperatorInfo.Title);
      // Pass connector data so Chargeprice API can match tariffs
      if (found.Connections?.length) {
        // "connectionTypeId:powerKw" pairs, semicolon-separated
        const connStr = found.Connections
          .filter((c) => c.ConnectionTypeID && c.PowerKW)
          .map((c) => `${c.ConnectionTypeID}:${c.PowerKW ?? 0}`)
          .join(";");
        if (connStr) priceParams.set("connections", connStr);
      }

      fetch(`/api/prices?${priceParams.toString()}`)
        .then((r) => r.json())
        .then((data: {
          lines?: { label: string; amount: number; unit: string }[];
          isFree?: boolean;
          rawText?: string;
          note?: string;
          source?: string;
          chargepriceUrl?: string;
          operatorUrl?: string;
        }) => {
          const el = document.getElementById(priceId);
          if (!el) return;
          let inner = `<div style="font-size:10px;color:${subduedColor};text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">💰 Preise</div>`;

          if (data.isFree) {
            inner += `<div style="font-size:14px;font-weight:800;color:#16a34a;">Kostenlos ✓</div>`;
          } else if (data.lines && data.lines.length > 0) {
            inner += data.lines.map(l =>
              `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;">
                <span style="font-size:12px;color:${mutedColor};">${l.label}</span>
                <span style="font-size:16px;font-weight:900;color:${priceColor};">${l.amount.toFixed(2)} <span style="font-size:11px;font-weight:500;opacity:0.7;">${l.unit}</span></span>
              </div>`
            ).join("");
            if (data.note) {
              inner += `<div style="font-size:11px;color:${subduedColor};margin-top:5px;border-top:1px solid ${rowBorder};padding-top:5px;">${data.note}</div>`;
            }
            const srcLabel = data.source === "chargeprice" ? "Chargeprice.app" : data.source === "ocm_parsed" ? "Betreiber (OCM)" : "Schätzung";
            inner += `<div style="font-size:10px;color:${subduedColor};margin-top:4px;">Quelle: ${srcLabel}</div>`;
          } else if (data.rawText) {
            inner += `<div style="font-size:12px;color:${mutedColor};line-height:1.5;">${data.rawText}</div>`;
          } else {
            inner += `<div style="font-size:12px;color:${subduedColor};">Keine Preisdaten verfügbar.</div>`;
            if (data.operatorUrl) {
              inner += `<a href="${data.operatorUrl}" target="_blank" rel="noopener" style="font-size:12px;color:${linkColor};display:block;margin-top:4px;">Preise beim Betreiber →</a>`;
            }
          }
          el.innerHTML = inner;
        })
        .catch(() => {
          const el = document.getElementById(priceId);
          if (el) el.innerHTML = `<div style="font-size:12px;color:${subduedColor};">Preise nicht verfügbar.</div>`;
        });
    });

    // Pointer cursor on hover
    map.on("mouseenter", CLUSTER_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", CLUSTER_LAYER, () => { map.getCanvas().style.cursor = ""; });
    map.on("mouseenter", POINT_LAYER,   () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", POINT_LAYER,   () => { map.getCanvas().style.cursor = ""; });

    // Click on map background → close popup
    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [POINT_LAYER, CLUSTER_LAYER] });
      if (!features.length) {
        popupRef.current?.remove();
        popupRef.current = null;
        onStationSelect?.(null);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      initialised.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Style change ---------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const url = STYLE_URLS[mapStyle];
    if (map.getStyle()?.sprite?.toString().includes(url.split("/").pop() ?? "")) return;
    map.setStyle(url);
    // Re-add source/layers after style load (maplibre removes them on style change)
    map.once("styledata", () => {
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: stationsToGeoJSON(stationsRef.current),
          cluster: true, clusterMaxZoom: 13, clusterRadius: 50,
        });
        // Re-add layers (simplified repaint)
        map.addLayer({ id: CLUSTER_LAYER, type: "circle", source: SOURCE_ID, filter: ["has", "point_count"], paint: { "circle-color": ["step", ["get", "point_count"], "#00ff88", 10, "#fbbf24", 50, "#ff4757"], "circle-radius": ["step", ["get", "point_count"], 20, 10, 28, 50, 36], "circle-stroke-width": 4, "circle-stroke-color": ["step", ["get", "point_count"], "#00cc6a", 10, "#f59e0b", 50, "#ff4757"], "circle-opacity": 1.0 } });
        map.addLayer({ id: CLUSTER_COUNT_LAYER, type: "symbol", source: SOURCE_ID, filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13 }, paint: { "text-color": "#fff" } });
        map.addLayer({ id: POINT_GLOW_LAYER, type: "circle", source: SOURCE_ID, filter: ["!", ["has", "point_count"]], paint: { "circle-color": ["get", "color"], "circle-radius": ["interpolate", ["linear"], ["get", "maxKw"], 0, 12, 50, 16, 150, 22], "circle-opacity": 0.40, "circle-blur": 1.2, "circle-stroke-width": 0 } });
        // Reload pin images after style change (canvas-based approach)
        void Promise.allSettled(ALL_PIN_TYPES.map(async (type) => {
          const imageData = await loadSvgPinImage(getEvPinSvg(type));
          if (!map.hasImage(`ev-pin-${type}`)) map.addImage(`ev-pin-${type}`, imageData, { pixelRatio: PIN_PIXEL_RATIO, sdf: false });
        }));
        map.addLayer({ id: POINT_LAYER, type: "symbol", source: SOURCE_ID, filter: ["!", ["has", "point_count"]], layout: { "icon-image": ["get", "pinType"], "icon-size": ["interpolate", ["exponential", 1.4], ["zoom"], 9, ["interpolate", ["linear"], ["get", "maxKw"], 0, 0.55, 150, 0.90], 12, ["interpolate", ["linear"], ["get", "maxKw"], 0, 0.90, 150, 1.40], 15, ["interpolate", ["linear"], ["get", "maxKw"], 0, 1.40, 150, 2.10], 18, ["interpolate", ["linear"], ["get", "maxKw"], 0, 1.90, 150, 2.80]], "icon-allow-overlap": true, "icon-anchor": "bottom" } });
        map.addLayer({ id: HEATMAP_LAYER, type: "heatmap", source: SOURCE_ID, layout: { visibility: showHeatmap ? "visible" : "none" }, paint: { "heatmap-weight": ["interpolate", ["linear"], ["get", "maxKw"], 0, 0, 350, 1], "heatmap-intensity": 1, "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,255,0)", 0.5, "royalblue", 1, "red"], "heatmap-radius": 20, "heatmap-opacity": 0.6 } });
      }
      // Re-add route source/layers after style change
      if (!map.getSource("route")) {
        map.addSource("route", {
          type: "geojson",
          data: pendingRouteRef.current ?? { type: "FeatureCollection", features: [] },
          lineMetrics: true,
        });
        map.addLayer({ id: "route-line-outline", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#1e3a5f", "line-width": 10, "line-opacity": 0.5 } });
        map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#3b82f6", "line-width": 6, "line-opacity": 1 } });
      }
      // 3D buildings
      toggle3D(map, show3D);
      // Always keep route lines on top of buildings
      if (map.getLayer("route-line-outline")) map.moveLayer("route-line-outline");
      if (map.getLayer("route-line")) map.moveLayer("route-line");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle]);

  // --- 3D buildings toggle --------------------------------------------------
  function toggle3D(map: maplibregl.Map, enable: boolean) {
    if (enable) {
      map.setPitch(45);
      if (!map.getLayer(BUILDINGS_LAYER)) {
        try {
          map.addLayer({
            id:     BUILDINGS_LAYER,
            source: "openmaptiles",
            "source-layer": "building",
            type:   "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color":  "#aaa",
              "fill-extrusion-height": ["get", "render_height"],
              "fill-extrusion-base":   ["get", "render_min_height"],
              "fill-extrusion-opacity": 0.6,
            },
          });
        } catch {
          // Source not available in this style – ignore
        }
      } else {
        map.setLayoutProperty(BUILDINGS_LAYER, "visibility", "visible");
      }
    } else {
      map.setPitch(0);
      if (map.getLayer(BUILDINGS_LAYER)) {
        map.setLayoutProperty(BUILDINGS_LAYER, "visibility", "none");
      }
    }
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    toggle3D(map, show3D);
    // Keep route lines on top of buildings whenever 3D state changes
    if (map.getLayer("route-line-outline")) map.moveLayer("route-line-outline");
    if (map.getLayer("route-line")) map.moveLayer("route-line");
  }, [show3D]);

  // --- Heatmap toggle -------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(HEATMAP_LAYER)) return;
    const vis = showHeatmap ? "visible" : "none";
    const rev = showHeatmap ? "none"    : "visible";
    map.setLayoutProperty(HEATMAP_LAYER,       "visibility", vis);
    map.setLayoutProperty(POINT_LAYER,         "visibility", rev);
    map.setLayoutProperty(POINT_GLOW_LAYER,    "visibility", rev);
    map.setLayoutProperty(CLUSTER_LAYER,       "visibility", rev);
    map.setLayoutProperty(CLUSTER_COUNT_LAYER, "visibility", rev);
  }, [showHeatmap]);

  // --- Fly to center --------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToCenter) return;
    const [lat, lng] = flyToCenter;
    map.flyTo({ center: [lng, lat], zoom: 13, duration: 1200 });
  }, [flyToCenter]);

  // --- User location marker -------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) markerRef.current.remove();
    if (!userLocation) return;
    const [lat, lng] = userLocation;

    const hasHeading = userHeading !== null && userHeading !== undefined && Number.isFinite(userHeading);

    if (hasHeading) {
      // Directional arrow marker — shows which way the user is facing/travelling
      const arrow = document.createElement("div");
      arrow.className = "user-location-outer";
      arrow.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
          <!-- Accuracy ring -->
          <circle cx="14" cy="14" r="13" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" stroke-width="1"/>
          <!-- Directional cone -->
          <path d="M14 2 L19 14 L14 11 L9 14 Z" fill="#3b82f6" opacity="0.7"/>
          <!-- Centre dot -->
          <circle cx="14" cy="14" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>
        </svg>`;
      arrow.style.transform = `rotate(${userHeading}deg)`;
      arrow.style.transformOrigin = "center";
      markerRef.current = new maplibregl.Marker({ element: arrow, rotationAlignment: "map" })
        .setRotation(userHeading!)
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      // Fallback: pulsing dot when heading is unknown
      const outer = document.createElement("div");
      outer.className = "user-location-outer";
      const inner = document.createElement("div");
      inner.className = "user-location-dot";
      outer.appendChild(inner);
      markerRef.current = new maplibregl.Marker({ element: outer })
        .setLngLat([lng, lat])
        .addTo(map);
    }
  }, [userLocation, userHeading]);

  // --- Re-fetch when filters change ----------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const { lat, lng } = map.getCenter();
    fetchStations(lat, lng);
  }, [filters, fetchStations]);

  // --- Route GeoJSON update ------------------------------------------------
  useEffect(() => {
    pendingRouteRef.current = routeGeoJSON ?? null;
    const map = mapRef.current;
    if (!map) return;

    function applyRoute() {
      const src = map!.getSource("route") as maplibregl.GeoJSONSource | undefined;
      if (!src) return false;
      src.setData(routeGeoJSON ?? { type: "FeatureCollection", features: [] });
      if (routeGeoJSON && routeGeoJSON.features.length > 0) {
        const coords: [number, number][] = [];
        for (const feature of routeGeoJSON.features) {
          if (feature.geometry.type === "LineString") {
            coords.push(...(feature.geometry.coordinates as [number, number][]));
          }
        }
        if (coords.length > 1) {
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          map!.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 80, duration: 900 },
          );
        }
      }
      return true;
    }

    if (!applyRoute()) {
      // Source not ready yet — retry on next styledata/load event
      map.once("styledata", applyRoute);
    }
  }, [routeGeoJSON]);

  // --- Nav position: live car marker + auto-follow -------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!navPosition) {
      // Remove nav marker when not navigating
      if (navMarkerRef.current) { navMarkerRef.current.remove(); navMarkerRef.current = null; }
      return;
    }

    const [lat, lng, bearing] = navPosition;

    // Create or update nav car marker
    if (!navMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "nav-car-marker";
      const arrow = document.createElement("div");
      arrow.className = "nav-car-arrow";
      el.appendChild(arrow);
      navMarkerRef.current = new maplibregl.Marker({ element: el, rotationAlignment: "map" })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      navMarkerRef.current.setLngLat([lng, lat]);
    }

    // Rotate marker to heading
    if (navMarkerRef.current) {
      navMarkerRef.current.setRotation(bearing);
    }

    // Auto-follow: keep nav position centered
    map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15), duration: 500, bearing });
  }, [navPosition]);

  // --- Charging stop markers -----------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    chargingMarkersRef.current.forEach((m) => m.remove());
    chargingMarkersRef.current = [];

    if (!chargingStops || chargingStops.length === 0) return;

    chargingStops.forEach((stop, i) => {
      const el = document.createElement("div");
      // Orange EV pin with stop number overlay
      const orangePin = getEvPinSvg("offline").replace(
        / fill="#dc2626"/g, " fill=\"#f97316\""
      ).replace(
        / flood-color="rgba\(220,38,38,[^)]+\)"/,
        " flood-color=\"rgba(249,115,22,0.55)\""
      );
      el.style.cssText = "position:relative;width:72px;height:92px;cursor:pointer;";
      el.innerHTML = `${orangePin}<span style="position:absolute;top:6px;left:50%;transform:translateX(-50%);font-weight:900;font-size:11px;color:#fff;font-family:system-ui,sans-serif;pointer-events:none">${i + 1}</span>`;
      el.title = `${stop.name} · ${stop.powerKw} kW · ~${stop.estimatedChargingMinutes} min`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);

      chargingMarkersRef.current.push(marker);
    });
  }, [chargingStops]);

  // --- Register global nav callback for popup button ----------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as Window & { __lkNav?: (lat: number, lng: number, label: string) => void }).__lkNav = (lat, lng, label) => {
        onNavigateTo?.(lat, lng, label);
        if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as Window & { __lkNav?: unknown }).__lkNav;
      }
    };
  }, [onNavigateTo]);

  // --- Register global community comment callback --------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    type CommentFn = (
      stationId: string, stationName: string, type: string,
      text: string, lat: number, lng: number,
      statusEl: HTMLElement | null,
    ) => void;
    (window as Window & { __lkComment?: CommentFn }).__lkComment = async (
      stationId, stationName, type, text, lat, lng, statusEl,
    ) => {
      if (statusEl) statusEl.textContent = "Wird gespeichert…";
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stationId, stationName, lat, lng,
            reportType: type,
            description: text?.slice(0, 300) ?? "",
          }),
        });
        if (statusEl) {
          statusEl.textContent = res.ok ? "✓ Danke für dein Feedback!" : "Fehler beim Senden.";
          statusEl.style.color = res.ok ? "#16a34a" : "#dc2626";
        }
      } catch {
        if (statusEl) { statusEl.textContent = "Netzwerkfehler."; statusEl.style.color = "#dc2626"; }
      }
    };
    return () => {
      delete (window as Window & { __lkComment?: unknown }).__lkComment;
    };
  }, []);

  // --- Highlight selected station ------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(SOURCE_ID)) return;
    if (selectedStation) {
      map.easeTo({
        center: [selectedStation.AddressInfo.Longitude, selectedStation.AddressInfo.Latitude],
        zoom: Math.max(map.getZoom(), 14),
        duration: 400,
      });
    }
  }, [selectedStation]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
  );
}
