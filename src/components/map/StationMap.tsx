"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { OCMStation } from "@/app/api/stations/route";
import { StationDetail } from "@/components/stations/StationDetail";
import type { StationFiltersState } from "./StationFilters";
import { createEvPinHtml, getStationPinType, ALL_PIN_TYPES, PIN_LABELS, getEvPinDataUrl, type PinType } from "@/lib/map-icons";

// Fix Leaflet default icon paths in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type MapStyle = "light" | "dark" | "satellite" | "standard";

const TILE_URLS: Record<MapStyle, { url: string; attribution: string }> = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri',
  },
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

/** Creates a Leaflet divIcon using the EV map pin SVG */
function createStationMarker(type: PinType, powerKw: number) {
  const size = powerKw >= 150 ? 36 : powerKw >= 22 ? 32 : 28;
  const height = Math.round(size * 46 / 36);
  return L.divIcon({
    className: "",
    html: createEvPinHtml(type, size),
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height],
  });
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FlyToCenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.0, easeLinearity: 0.3 });
  }, [center, map]);
  return null;
}

function UserLocationMarker({ pos }: { pos: [number, number] | null }) {
  if (!pos) return null;
  return (
    <>
      <Marker
        position={pos}
        icon={L.divIcon({
          className: "",
          html: `<div style="
            width:16px;height:16px;
            background:#3b82f6;
            border:3px solid white;
            border-radius:50%;
            box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 2px 6px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })}
      />
      <Circle
        center={pos}
        radius={120}
        pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.08, weight: 1 }}
      />
    </>
  );
}

function BoundsChangeHandler({
  onBoundsChange,
}: {
  onBoundsChange: (lat: number, lng: number, zoom: number) => void;
}) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      onBoundsChange(c.lat, c.lng, e.target.getZoom());
    },
  });
  return null;
}

// Cluster group rendered imperatively (react-leaflet has no cluster component)
function ClusterLayer({
  stations,
  onSelect,
}: {
  stations: OCMStation[];
  onSelect: (s: OCMStation) => void;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    // Side-effect import: extends L namespace with markerClusterGroup()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("leaflet.markercluster");
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }
    // After require, L.markerClusterGroup is available via @types/leaflet.markercluster
    const cluster = (L as unknown as { markerClusterGroup: (opts: unknown) => L.MarkerClusterGroup }).markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (c: L.MarkerCluster) => {
        const n = c.getChildCount();
        const size = n > 50 ? 44 : n > 20 ? 38 : 32;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:linear-gradient(135deg,#16a34a,#15803d);
            border:3px solid white;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-weight:800;font-size:${size < 38 ? 11 : 13}px;color:white;
            box-shadow:0 2px 10px rgba(0,0,0,0.3);
          ">${n}</div>`,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    stations.forEach((station) => {
      const maxPower = Math.max(
        0,
        ...(station.Connections?.map((c) => c.PowerKW ?? 0) ?? []),
      );
      const pinType = getStationPinType(maxPower, station.StatusType?.IsOperational ?? null);

      const marker = L.marker(
        [station.AddressInfo.Latitude, station.AddressInfo.Longitude],
        { icon: createStationMarker(pinType, maxPower) },
      );

      marker.on("click", () => onSelect(station));
      cluster.addLayer(marker);
    });

    clusterRef.current = cluster;
    map.addLayer(cluster);

    return () => {
      if (clusterRef.current) map.removeLayer(clusterRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]);

  return null;
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface StationMapProps {
  defaultCenter: [number, number];
  filters: StationFiltersState;
  flyToCenter: [number, number] | null;
  userLocation: [number, number] | null;
  mapStyle?: MapStyle;
  onStationsChange?: (stations: OCMStation[]) => void;
  externalSelectedStation?: OCMStation | null;
  onExternalSelectClear?: () => void;
}

export function StationMap({
  defaultCenter,
  filters,
  flyToCenter,
  userLocation,
  mapStyle = "light",
  onStationsChange,
  externalSelectedStation,
  onExternalSelectClear,
}: StationMapProps) {
  const t = useTranslations("map");
  const [stations, setStations] = useState<OCMStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState<OCMStation | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const currentCenter = useRef<[number, number]>(defaultCenter);
  const currentZoom = useRef<number>(12);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStations = useCallback(async (lat: number, lng: number) => {
    // Debounce: warte 400ms bevor Fetch ausgelöst wird
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(async () => {
      setLoading(true);
      setApiError(null);
      // Dynamischer Radius je nach Zoom
      const zoom = currentZoom.current;
      const distance = zoom >= 14 ? 8 : zoom >= 12 ? 15 : zoom >= 10 ? 30 : 60;
      const maxResults = zoom >= 14 ? 80 : zoom >= 12 ? 150 : 200;

      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        distance: String(distance),
        maxResults: String(maxResults),
      });
      if (filters.powerLevel) params.set("powerLevel", filters.powerLevel);
      if (filters.connectorType) params.set("connectorType", filters.connectorType);

      try {
        const res = await fetch(`/api/stations?${params.toString()}`);
        if (res.ok) {
          const data: OCMStation[] = await res.json();
          setStations(data);
          onStationsChange?.(data);
        } else if (res.status === 403) {
          setApiError("OCM API Key fehlt â†’ OCM_API_KEY in .env.local setzen (kostenlos: openchargemap.org)");
        } else if (res.status === 429) {
          setApiError("Rate-Limit erreicht. OCM_API_KEY in .env.local setzen.");
        }
      } finally {
        setLoading(false);
      }
    }, 400);
  // onStationsChange is intentionally excluded — it's a stable callback from parent
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetchStations(defaultCenter[0], defaultCenter[1]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStations(currentCenter.current[0], currentCenter.current[1]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Merge external selection (from feed panel)
  useEffect(() => {
    if (externalSelectedStation) {
      setSelectedStation(externalSelectedStation);
    }
  }, [externalSelectedStation]);

  // Station count by status
  const stats = {
    available: stations.filter((s) => s.StatusType?.IsOperational).length,
    defect: stations.filter((s) => s.StatusType && !s.StatusType.IsOperational).length,
    unknown: stations.filter((s) => !s.StatusType).length,
  };

  return (
    <div className="relative flex-1 h-full">
      {/* Loading pill */}
      {loading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[600] bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-full px-4 py-1.5 text-xs font-medium text-[var(--text-muted)] shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          {t("loading")}
        </div>
      )}

      {/* API error banner */}
      {apiError && (
        <div className="absolute top-16 left-4 right-4 z-[600] bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3 text-xs text-amber-800 dark:text-amber-300 shadow-md flex items-start gap-2">
          <span className="shrink-0 mt-0.5">âš </span>
          <span>{apiError}</span>
        </div>
      )}

      {/* Stats bar */}
      {!loading && stations.length > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[500] flex gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-[var(--border)] rounded-full px-3 py-1 shadow text-[11px] font-semibold whitespace-nowrap">
          <span className="text-green-600">● {stats.available}</span>
          <span className="text-zinc-400">·</span>
          <span className="text-red-500">● {stats.defect}</span>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-400">● {stats.unknown}</span>
          <span className="text-zinc-400 font-normal">= {stations.length} {t("stations_found", { count: "" }).replace(" ", "")}</span>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        {/* Dynamic tile layer based on selected map style */}
        <TileLayer
          attribution={TILE_URLS[mapStyle].attribution}
          url={TILE_URLS[mapStyle].url}
          maxZoom={19}
          detectRetina={true}
        />

        <FlyToCenter center={flyToCenter} />
        <UserLocationMarker pos={userLocation} />

        <BoundsChangeHandler
          onBoundsChange={(lat, lng, zoom) => {
            currentCenter.current = [lat, lng];
            currentZoom.current = zoom;
            fetchStations(lat, lng);
          }}
        />

        <ClusterLayer stations={stations} onSelect={setSelectedStation} />
      </MapContainer>

      {/* Station detail panel — slide up from bottom */}
      {selectedStation && (
        <div className="absolute bottom-0 left-0 right-0 z-[500] animate-slide-up">
          <div className="max-w-lg mx-auto px-3 pb-4">
            <StationDetail
              station={selectedStation}
              onClose={() => { setSelectedStation(null); onExternalSelectClear?.(); }}
            />
          </div>
        </div>
      )}

      {/* Legend bottom-right — EV pin icon types */}
      <div className="absolute bottom-4 right-4 z-[400] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-[var(--border)] rounded-xl px-3 py-2 shadow text-xs space-y-1.5 hidden sm:block">
        {ALL_PIN_TYPES.map((type) => (
          <div key={type} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getEvPinDataUrl(type)}
              alt={PIN_LABELS[type]}
              width={16}
              height={20}
              className="shrink-0"
            />
            <span className="text-[var(--text-muted)]">{PIN_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
