"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import type { OCMStation } from "@/app/api/stations/route";
import { StationDetail } from "@/components/stations/StationDetail";
import type { StationFiltersState } from "./StationFilters";

// Fix Leaflet default icon paths in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type StatusColor = "available" | "occupied" | "defect" | "unknown";

function getStatusColor(color: StatusColor): string {
  const colors: Record<StatusColor, string> = {
    available: "#16a34a",
    occupied: "#d97706",
    defect: "#dc2626",
    unknown: "#94a3b8",
  };
  return colors[color];
}

function createColoredMarker(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:20px;height:20px;
      background:${color};
      border:2.5px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

interface FlyToProps {
  center: [number, number] | null;
}

function FlyToCenter({ center }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

function BoundsChangeHandler({
  onBoundsChange,
}: {
  onBoundsChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onBoundsChange(center.lat, center.lng);
    },
  });
  return null;
}

interface StationMapProps {
  defaultCenter: [number, number];
  filters: StationFiltersState;
  flyToCenter: [number, number] | null;
}

export function StationMap({ defaultCenter, filters, flyToCenter }: StationMapProps) {
  const t = useTranslations("map");
  const [stations, setStations] = useState<OCMStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState<OCMStation | null>(null);
  const currentCenter = useRef<[number, number]>(defaultCenter);

  async function fetchStations(lat: number, lng: number) {
    setLoading(true);
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      distance: "15",
      maxResults: "150",
    });
    if (filters.powerLevel) params.set("powerLevel", filters.powerLevel);
    if (filters.connectorType) params.set("connectorType", filters.connectorType);

    try {
      const res = await fetch(`/api/stations?${params.toString()}`);
      if (res.ok) {
        const data: OCMStation[] = await res.json();
        setStations(data);
      }
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount
  useEffect(() => {
    fetchStations(defaultCenter[0], defaultCenter[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchStations(currentCenter.current[0], currentCenter.current[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="relative flex-1 h-full">
      {loading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[600] bg-[var(--bg-surface)] border border-[var(--border)] rounded-full px-4 py-1.5 text-xs font-medium text-[var(--text-muted)] shadow flex items-center gap-2">
          <div className="w-3 h-3 border border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          {t("loading")}
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToCenter center={flyToCenter} />
        <BoundsChangeHandler
          onBoundsChange={(lat, lng) => {
            currentCenter.current = [lat, lng];
            fetchStations(lat, lng);
          }}
        />

        {stations.map((station) => {
          const status: StatusColor = station.StatusType?.IsOperational
            ? "available"
            : station.StatusType
              ? "defect"
              : "unknown";

          return (
            <Marker
              key={station.ID}
              position={[
                station.AddressInfo.Latitude,
                station.AddressInfo.Longitude,
              ]}
              icon={createColoredMarker(getStatusColor(status))}
              eventHandlers={{
                click: () => setSelectedStation(station),
              }}
            >
              <Popup maxWidth={300}>
                <div className="text-sm font-semibold text-zinc-900">
                  {station.AddressInfo.Title}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {station.AddressInfo.AddressLine1}, {station.AddressInfo.Town}
                </div>
                <div
                  className="text-xs mt-1 font-medium"
                  style={{ color: getStatusColor(status) }}
                >
                  {t(`status_${status}` as "status_available" | "status_occupied" | "status_defect" | "status_unknown")}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Station detail panel */}
      {selectedStation && (
        <div className="absolute bottom-4 left-4 right-4 z-[500] max-w-lg mx-auto">
          <StationDetail
            station={selectedStation}
            onClose={() => setSelectedStation(null)}
          />
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-[var(--bg-surface)]/90 backdrop-blur-sm border border-[var(--border)] rounded-xl px-3 py-2 shadow text-xs space-y-1 hidden sm:block">
        {(["available", "occupied", "defect", "unknown"] as StatusColor[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border border-white/50"
              style={{ background: getStatusColor(s) }}
            />
            <span className="text-[var(--text-muted)]">
              {t(`status_${s}` as "status_available" | "status_occupied" | "status_defect" | "status_unknown")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
