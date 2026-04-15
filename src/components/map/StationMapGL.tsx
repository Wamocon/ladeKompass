"use client";

import { useEffect, useRef, useCallback, Dispatch } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StationFiltersState } from "./StationFilters";
import type { OCMStation } from "@/app/api/stations/route";

export type MapStyle = "light" | "dark" | "satellite" | "standard" | "3d";

// --- Free tile style URLs (no API key required) ------------------------------
const STYLE_URLS: Record<MapStyle, string> = {
  light:     "https://tiles.openfreemap.org/styles/positron",
  dark:      "https://tiles.openfreemap.org/styles/dark-matter",
  satellite: "https://tiles.openfreemap.org/styles/liberty",
  standard:  "https://tiles.openfreemap.org/styles/liberty",
  "3d":      "https://tiles.openfreemap.org/styles/liberty",
};

// --- Status colour helpers --------------------------------------------------
function stationColor(station: OCMStation): string {
  if (station.StatusType?.IsOperational === true)  return "#22c55e"; // green
  if (station.StatusType?.IsOperational === false) return "#ef4444"; // red
  return "#94a3b8"; // grey = unknown
}

function maxKw(station: OCMStation): number {
  return Math.max(0, ...(station.Connections?.map((c) => c.PowerKW ?? 0) ?? []));
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
        id:       s.ID,
        uuid:     s.UUID,
        title:    s.AddressInfo.Title,
        town:     s.AddressInfo.Town ?? "",
        postcode: s.AddressInfo.Postcode ?? "",
        maxKw:    maxKw(s),
        color:    stationColor(s),
        operator: s.OperatorInfo?.Title ?? "",
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
}

const SOURCE_ID = "stations";
const CLUSTER_LAYER = "clusters";
const CLUSTER_COUNT_LAYER = "cluster-count";
const POINT_LAYER = "unclustered-point";
const HEATMAP_LAYER = "heatmap";
const BUILDINGS_LAYER = "3d-buildings";

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
}: StationMapGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const markerRef    = useRef<maplibregl.Marker | null>(null); // user location
  const stationsRef  = useRef<OCMStation[]>([]);
  const abortRef     = useRef<AbortController | null>(null);
  const fetchTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialised  = useRef(false);

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
      antialias:        true,
      attributionControl: true,
    });

    mapRef.current = map;

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

      // Cluster circle
      map.addLayer({
        id:     CLUSTER_LAYER,
        type:   "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color":  ["step", ["get", "point_count"], "#4ade80", 10, "#facc15", 50, "#f87171"],
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 50, 30],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.9,
        },
      });

      // Cluster count label
      map.addLayer({
        id:     CLUSTER_COUNT_LAYER,
        type:   "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field":  ["get", "point_count_abbreviated"],
          "text-font":   ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size":   12,
        },
        paint: { "text-color": "#1a1a1a" },
      });

      // Individual station dot
      map.addLayer({
        id:     POINT_LAYER,
        type:   "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color":        ["get", "color"],
          "circle-radius":       ["interpolate", ["linear"], ["get", "maxKw"], 0, 5, 50, 7, 150, 10, 350, 13],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#fff",
          "circle-opacity":      0.95,
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
      (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err || zoom == null) return;
          const geom = feature.geometry as GeoJSON.Point;
          map.easeTo({ center: geom.coordinates as [number, number], zoom });
        },
      );
    });

    // Click individual station → select
    map.on("click", POINT_LAYER, (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const stationId = feature.properties?.id as number;
      const found = stationsRef.current.find((s) => s.ID === stationId) ?? null;
      onStationSelect?.(found);
      if (found) {
        map.easeTo({
          center: [found.AddressInfo.Longitude, found.AddressInfo.Latitude],
          zoom: Math.max(map.getZoom(), 14),
          duration: 400,
        });
      }
    });

    // Pointer cursor on hover
    map.on("mouseenter", CLUSTER_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", CLUSTER_LAYER, () => { map.getCanvas().style.cursor = ""; });
    map.on("mouseenter", POINT_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", POINT_LAYER, () => { map.getCanvas().style.cursor = ""; });

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
        map.addLayer({ id: CLUSTER_LAYER, type: "circle", source: SOURCE_ID, filter: ["has", "point_count"], paint: { "circle-color": ["step", ["get", "point_count"], "#4ade80", 10, "#facc15", 50, "#f87171"], "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 50, 30], "circle-stroke-width": 2, "circle-stroke-color": "#fff", "circle-opacity": 0.9 } });
        map.addLayer({ id: CLUSTER_COUNT_LAYER, type: "symbol", source: SOURCE_ID, filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], "text-size": 12 }, paint: { "text-color": "#1a1a1a" } });
        map.addLayer({ id: POINT_LAYER, type: "circle", source: SOURCE_ID, filter: ["!", ["has", "point_count"]], paint: { "circle-color": ["get", "color"], "circle-radius": ["interpolate", ["linear"], ["get", "maxKw"], 0, 5, 50, 7, 150, 10, 350, 13], "circle-stroke-width": 1.5, "circle-stroke-color": "#fff", "circle-opacity": 0.95 } });
        map.addLayer({ id: HEATMAP_LAYER, type: "heatmap", source: SOURCE_ID, layout: { visibility: showHeatmap ? "visible" : "none" }, paint: { "heatmap-weight": ["interpolate", ["linear"], ["get", "maxKw"], 0, 0, 350, 1], "heatmap-intensity": 1, "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,255,0)", 0.5, "royalblue", 1, "red"], "heatmap-radius": 20, "heatmap-opacity": 0.6 } });
      }
      // 3D buildings
      toggle3D(map, show3D);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show3D]);

  // --- Heatmap toggle -------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(HEATMAP_LAYER)) return;
    map.setLayoutProperty(HEATMAP_LAYER, "visibility", showHeatmap ? "visible" : "none");
    map.setLayoutProperty(POINT_LAYER,   "visibility", showHeatmap ? "none"    : "visible");
    map.setLayoutProperty(CLUSTER_LAYER, "visibility", showHeatmap ? "none"    : "visible");
    map.setLayoutProperty(CLUSTER_COUNT_LAYER, "visibility", showHeatmap ? "none" : "visible");
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
    const el = document.createElement("div");
    el.className = "user-location-dot";
    el.style.cssText = "width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,0.25)";
    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map);
  }, [userLocation]);

  // --- Re-fetch when filters change ----------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const { lat, lng } = map.getCenter();
    fetchStations(lat, lng);
  }, [filters, fetchStations]);

  // --- Highlight selected station -------------------------------------------
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
