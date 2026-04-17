/**
 * Pure route calculation utilities — no side effects, no I/O.
 * Extracted so they can be unit-tested without Next.js / Supabase context.
 */

export const CONSUMPTION_KWH_PER_100KM = 18;
export const EARTH_RADIUS_KM = 6371;
export const AVG_SPEED_KM_H = 100;
export const AVG_SESSION_MINUTES_PER_100KM = (100 / AVG_SPEED_KM_H) * 60; // 60

/** Haversine distance between two coordinates in km. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Estimate range in km based on usable battery energy. */
export function estimateRangeKm(usableKwh: number): number {
  return (usableKwh / CONSUMPTION_KWH_PER_100KM) * 100;
}

/** Usable energy given current and minimum SoC. */
export function usableEnergyKwh(
  batteryCapacityKwh: number,
  currentSocPercent: number,
  minArrivalSocPercent: number,
): number {
  const delta = Math.max(0, currentSocPercent - minArrivalSocPercent);
  return (delta / 100) * batteryCapacityKwh;
}

/** Energy needed to cover a distance at the average consumption rate. */
export function energyForDistanceKwh(distanceKm: number): number {
  return (distanceKm / 100) * CONSUMPTION_KWH_PER_100KM;
}

/** Estimated travel time in minutes for a given distance. */
export function estimateTravelMinutes(distanceKm: number): number {
  return Math.round((distanceKm / AVG_SPEED_KM_H) * 60);
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface RouteInputValidated {
  startLat: number;
  startLng: number;
  startName: string;
  endLat: number;
  endLng: number;
  endName: string;
  batteryCapacityKwh: number;
  currentSocPercent: number;
  minArrivalSocPercent: number;
}

/**
 * Validate and normalise route input.
 * Returns validated data or a list of errors.
 */
export function validateRouteInput(
  input: Partial<RouteInputValidated>,
): { data: RouteInputValidated; errors: null } | { data: null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  const startLat = Number(input.startLat);
  const startLng = Number(input.startLng);
  const endLat = Number(input.endLat);
  const endLng = Number(input.endLng);
  const batteryCapacityKwh = Number(input.batteryCapacityKwh);
  const currentSocPercent = Number(input.currentSocPercent);
  const minArrivalSocPercent = Number(input.minArrivalSocPercent ?? 10);

  if (!isFinite(startLat) || startLat < -90 || startLat > 90)
    errors.push({ field: "startLat", message: "Breitengrad muss zwischen -90 und 90 liegen." });

  if (!isFinite(startLng) || startLng < -180 || startLng > 180)
    errors.push({ field: "startLng", message: "Längengrad muss zwischen -180 und 180 liegen." });

  if (!isFinite(endLat) || endLat < -90 || endLat > 90)
    errors.push({ field: "endLat", message: "Breitengrad muss zwischen -90 und 90 liegen." });

  if (!isFinite(endLng) || endLng < -180 || endLng > 180)
    errors.push({ field: "endLng", message: "Längengrad muss zwischen -180 und 180 liegen." });

  if (!isFinite(batteryCapacityKwh) || batteryCapacityKwh <= 0 || batteryCapacityKwh > 300)
    errors.push({ field: "batteryCapacityKwh", message: "Akkukapazität muss zwischen 0 und 300 kWh liegen." });

  if (!isFinite(currentSocPercent) || currentSocPercent < 0 || currentSocPercent > 100)
    errors.push({ field: "currentSocPercent", message: "SoC muss zwischen 0 und 100 liegen." });

  if (!isFinite(minArrivalSocPercent) || minArrivalSocPercent < 0 || minArrivalSocPercent > 100)
    errors.push({ field: "minArrivalSocPercent", message: "Mindest-SoC muss zwischen 0 und 100 liegen." });

  if (isFinite(currentSocPercent) && isFinite(minArrivalSocPercent) && minArrivalSocPercent >= currentSocPercent)
    errors.push({ field: "minArrivalSocPercent", message: "Mindest-SoC muss kleiner als aktueller SoC sein." });

  if (errors.length > 0) return { data: null, errors };

  return {
    data: {
      startLat,
      startLng,
      startName: String(input.startName ?? `${startLat}, ${startLng}`),
      endLat,
      endLng,
      endName: String(input.endName ?? `${endLat}, ${endLng}`),
      batteryCapacityKwh,
      currentSocPercent,
      minArrivalSocPercent,
    },
    errors: null,
  };
}

export type ReportType = "available" | "occupied" | "defect" | "price" | "other";
export const VALID_REPORT_TYPES: readonly ReportType[] = [
  "available",
  "occupied",
  "defect",
  "price",
  "other",
];

export interface ReportValidationError {
  field: string;
  message: string;
}

export function validateReportPayload(body: unknown): {
  data: {
    stationId: string;
    stationName?: string;
    lat?: number;
    lng?: number;
    reportType: ReportType;
    description?: string;
    priceKwh?: number;
  };
  errors: null;
} | { data: null; errors: ReportValidationError[] } {
  const errors: ReportValidationError[] = [];

  if (typeof body !== "object" || body === null) {
    return { data: null, errors: [{ field: "body", message: "Invalid request body." }] };
  }

  const b = body as Record<string, unknown>;

  if (!b.stationId || typeof b.stationId !== "string" || b.stationId.trim() === "")
    errors.push({ field: "stationId", message: "stationId ist erforderlich." });

  if (!VALID_REPORT_TYPES.includes(b.reportType as ReportType))
    errors.push({ field: "reportType", message: `reportType muss einer von: ${VALID_REPORT_TYPES.join(", ")} sein.` });

  if (b.lat !== undefined && (typeof b.lat !== "number" || b.lat < -90 || b.lat > 90))
    errors.push({ field: "lat", message: "Breitengrad muss zwischen -90 und 90 liegen." });

  if (b.lng !== undefined && (typeof b.lng !== "number" || b.lng < -180 || b.lng > 180))
    errors.push({ field: "lng", message: "Längengrad muss zwischen -180 und 180 liegen." });

  if (b.description !== undefined) {
    if (typeof b.description !== "string")
      errors.push({ field: "description", message: "description muss ein String sein." });
    else if (b.description.length > 500)
      errors.push({ field: "description", message: "description darf maximal 500 Zeichen haben." });
  }

  if (b.priceKwh !== undefined && (typeof b.priceKwh !== "number" || b.priceKwh < 0 || b.priceKwh > 10))
    errors.push({ field: "priceKwh", message: "priceKwh muss zwischen 0 und 10 EUR/kWh liegen." });

  if (errors.length > 0) return { data: null, errors };

  return {
    data: {
      stationId: (b.stationId as string).trim(),
      stationName: b.stationName as string | undefined,
      lat: b.lat as number | undefined,
      lng: b.lng as number | undefined,
      reportType: b.reportType as ReportType,
      description: b.description as string | undefined,
      priceKwh: b.priceKwh as number | undefined,
    },
    errors: null,
  };
}

export interface StationsQueryValidated {
  lat: number;
  lng: number;
  distance: number;
  maxResults: number;
  powerLevel?: string;
  connectorType?: string;
}

export const VALID_POWER_LEVELS = ["ac", "dc", "hpc"] as const;
export const VALID_CONNECTOR_TYPES = ["type2", "ccs", "chademo", "tesla_ccs"] as const;

export function validateStationsQuery(params: URLSearchParams): {
  data: StationsQueryValidated;
  errors: null;
} | { data: null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  const lat = parseFloat(params.get("lat") ?? "");
  const lng = parseFloat(params.get("lng") ?? "");
  const distance = parseFloat(params.get("distance") ?? "25");
  const maxResults = parseInt(params.get("maxResults") ?? "100", 10);
  const powerLevel = params.get("powerLevel") ?? undefined;
  const connectorType = params.get("connectorType") ?? undefined;

  if (!isFinite(lat) || lat < -90 || lat > 90)
    errors.push({ field: "lat", message: "lat ist erforderlich und muss zwischen -90 und 90 liegen." });

  if (!isFinite(lng) || lng < -180 || lng > 180)
    errors.push({ field: "lng", message: "lng ist erforderlich und muss zwischen -180 und 180 liegen." });

  if (!isFinite(distance) || distance <= 0 || distance > 500)
    errors.push({ field: "distance", message: "distance muss zwischen 0 und 500 km liegen." });

  if (!isFinite(maxResults) || maxResults < 1 || maxResults > 500)
    errors.push({ field: "maxResults", message: "maxResults muss zwischen 1 und 500 liegen." });

  if (powerLevel && !VALID_POWER_LEVELS.includes(powerLevel as typeof VALID_POWER_LEVELS[number]))
    errors.push({ field: "powerLevel", message: `powerLevel muss einer von: ${VALID_POWER_LEVELS.join(", ")} sein.` });

  if (connectorType && !VALID_CONNECTOR_TYPES.includes(connectorType as typeof VALID_CONNECTOR_TYPES[number]))
    errors.push({ field: "connectorType", message: `connectorType muss einer von: ${VALID_CONNECTOR_TYPES.join(", ")} sein.` });

  if (errors.length > 0) return { data: null, errors };

  return {
    data: {
      lat,
      lng,
      distance,
      maxResults,
      powerLevel,
      connectorType,
    },
    errors: null,
  };
}
