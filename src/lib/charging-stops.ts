/**
 * Charging-stop planner for EV navigation.
 *
 * Runs entirely client-side: samples the OSRM route geometry at the points
 * where the battery would run low, then queries /api/stations to find the
 * best real charging station near each planned stop.
 */

import type * as GeoJSON from "geojson";
import type { OCMStation } from "@/app/api/stations/route";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlannedChargingStop {
  lat: number;
  lng: number;
  /** Display name of the charging station (or a fallback) */
  name: string;
  /** Max charging power at this station in kW */
  powerKw: number;
  /** Cumulative distance from route start to this stop in metres */
  distanceFromStartM: number;
  /** Estimated charging time in minutes (from ~15 % to 80 % SoC) */
  estimatedChargingMinutes: number;
  /** The matching OCM station object, or null if none was found within 8 km */
  station: OCMStation | null;
}

export interface ChargingStopPlan {
  stops: PlannedChargingStop[];
  /** Total added time from all charging stops in minutes */
  totalChargingMinutes: number;
  /** [lng, lat] pairs for OSRM multi-waypoint routing */
  waypointCoords: Array<[number, number]>;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function distanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
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
 * Interpolate a point on a [lng, lat] LineString at exactly `targetDistM`
 * metres from the start.  Returns the last coordinate when target exceeds
 * the total length.
 */
function sampleAt(
  coords: [number, number][],
  targetDistM: number,
): [number, number] {
  let cum = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng0, lat0] = coords[i - 1];
    const [lng1, lat1] = coords[i];
    const seg = distanceM(lat0, lng0, lat1, lng1);
    if (cum + seg >= targetDistM) {
      const t = seg > 0 ? (targetDistM - cum) / seg : 0;
      return [lng0 + t * (lng1 - lng0), lat0 + t * (lat1 - lat0)];
    }
    cum += seg;
  }
  return coords[coords.length - 1];
}

/**
 * Query /api/stations for the best charging station within 8 km of a point.
 * Prefers operational high-power stations.
 */
async function findNearbyStation(
  lat: number,
  lng: number,
): Promise<OCMStation | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      distance: "8",
      maxResults: "15",
    });
    const res = await fetch(`/api/stations?${params.toString()}`);
    if (!res.ok) return null;
    const stations: unknown = await res.json();
    if (!Array.isArray(stations) || stations.length === 0) return null;

    const ocmStations = stations as OCMStation[];
    const scored = ocmStations
      .filter((s) => s.StatusType?.IsOperational !== false)
      .map((s) => ({
        station: s,
        maxKw: Math.max(0, ...(s.Connections?.map((c) => c.PowerKW ?? 0) ?? [])),
      }))
      .sort((a, b) => b.maxKw - a.maxKw);

    return scored.length > 0 ? scored[0].station : ocmStations[0];
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Plan charging stops along an OSRM route.
 *
 * @param geometry        OSRM LineString — coordinates in [lng, lat] order
 * @param totalDistM      Total route distance in metres
 * @param vehicleRangeKm  Full-charge range in km
 * @param currentBatteryPct  Current state of charge (0–100)
 * @param minArrivalPct   Minimum SoC buffer to keep at each stop / destination (default 15)
 * @param batteryKwh      Usable battery capacity for charging-time estimate (default 70 kWh)
 */
export async function planChargingStops(
  geometry: GeoJSON.LineString,
  totalDistM: number,
  vehicleRangeKm: number,
  currentBatteryPct: number,
  minArrivalPct = 15,
  batteryKwh = 70,
): Promise<ChargingStopPlan> {
  const coords = geometry.coordinates as [number, number][];
  const maxRangeM = vehicleRangeKm * 1000;

  // Safety reserve that must remain in the battery at every stop
  const reserveM = maxRangeM * (minArrivalPct / 100);
  // Effective range per leg (full charge → reserve left)
  const legRangeM = maxRangeM - reserveM;

  const stops: PlannedChargingStop[] = [];

  // How far the vehicle can currently travel before hitting the reserve
  let availableM = maxRangeM * (currentBatteryPct / 100) - reserveM;
  // Cumulative distance from start to the last stop (or 0 at the start)
  let lastStopDist = 0;

  // Guard against unreasonable inputs (e.g. range <= reserve)
  if (legRangeM <= 0 || availableM <= 0) {
    return { stops: [], totalChargingMinutes: 0, waypointCoords: [] };
  }

  while (lastStopDist + availableM < totalDistM) {
    // Charge at 85 % of remaining range — "charge before empty" heuristic
    const chargeAt = lastStopDist + availableM * 0.85;
    const point = sampleAt(coords, chargeAt);
    const [sLng, sLat] = point;

    const station = await findNearbyStation(sLat, sLng);
    const maxKw = station
      ? Math.max(50, ...(station.Connections?.map((c) => c.PowerKW ?? 0) ?? []))
      : 50;

    // Estimate: charge from minArrivalPct → 80 %
    const chargeKwh = batteryKwh * ((80 - minArrivalPct) / 100);
    const chargingMinutes = Math.ceil((chargeKwh / maxKw) * 60);

    stops.push({
      lat: station?.AddressInfo.Latitude ?? sLat,
      lng: station?.AddressInfo.Longitude ?? sLng,
      name: station?.AddressInfo.Title ?? "Ladestation (empfohlen)",
      powerKw: maxKw,
      distanceFromStartM: chargeAt,
      estimatedChargingMinutes: chargingMinutes,
      station: station ?? null,
    });

    lastStopDist = chargeAt;
    availableM = legRangeM; // recharged to ~80 % SoC, back to full leg range

    // Hard safety cap (should never be needed for realistic routes)
    if (stops.length >= 12) break;
  }

  return {
    stops,
    totalChargingMinutes: stops.reduce((s, st) => s + st.estimatedChargingMinutes, 0),
    waypointCoords: stops.map((s) => [s.lng, s.lat]),
  };
}
