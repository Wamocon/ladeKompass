import { describe, it, expect } from "vitest";
import {
  haversineKm,
  estimateRangeKm,
  usableEnergyKwh,
  energyForDistanceKwh,
  estimateTravelMinutes,
  validateRouteInput,
  validateReportPayload,
  validateStationsQuery,
  CONSUMPTION_KWH_PER_100KM,
  EARTH_RADIUS_KM,
  VALID_REPORT_TYPES,
  VALID_POWER_LEVELS,
  VALID_CONNECTOR_TYPES,
} from "../route-calc";

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

describe("constants", () => {
  it("CONSUMPTION_KWH_PER_100KM is 18", () => {
    expect(CONSUMPTION_KWH_PER_100KM).toBe(18);
  });

  it("EARTH_RADIUS_KM is 6371", () => {
    expect(EARTH_RADIUS_KM).toBe(6371);
  });

  it("VALID_REPORT_TYPES contains all expected values", () => {
    expect(VALID_REPORT_TYPES).toEqual(["available", "occupied", "defect", "price", "other"]);
  });

  it("VALID_POWER_LEVELS contains ac, dc, hpc", () => {
    expect(VALID_POWER_LEVELS).toEqual(["ac", "dc", "hpc"]);
  });

  it("VALID_CONNECTOR_TYPES contains all expected values", () => {
    expect(VALID_CONNECTOR_TYPES).toEqual(["type2", "ccs", "chademo", "tesla_ccs"]);
  });
});

// ─────────────────────────────────────────────────────────────────
// haversineKm
// ─────────────────────────────────────────────────────────────────

describe("haversineKm", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineKm(52.52, 13.405, 52.52, 13.405)).toBeCloseTo(0, 3);
  });

  it("Berlin to Munich is approximately 504 km", () => {
    // Berlin: 52.52, 13.405 | Munich: 48.137, 11.576
    expect(haversineKm(52.52, 13.405, 48.137, 11.576)).toBeCloseTo(504, -1);
  });

  it("is symmetric (A→B == B→A)", () => {
    const d1 = haversineKm(52.52, 13.405, 48.137, 11.576);
    const d2 = haversineKm(48.137, 11.576, 52.52, 13.405);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it("Hamburg to Frankfurt is approx 393 km (straight-line)", () => {
    // Hamburg: 53.55, 9.993 | Frankfurt: 50.11, 8.682 — Luftlinie, nicht Fahrstrecke
    expect(haversineKm(53.55, 9.993, 50.11, 8.682)).toBeCloseTo(393, -1);
  });

  it("handles negative coordinates (southern hemisphere)", () => {
    const d = haversineKm(-33.9, 18.4, -23.5, -46.6);
    expect(d).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// estimateRangeKm
// ─────────────────────────────────────────────────────────────────

describe("estimateRangeKm", () => {
  it("18 kWh → 100 km", () => {
    expect(estimateRangeKm(18)).toBeCloseTo(100, 5);
  });

  it("36 kWh → 200 km", () => {
    expect(estimateRangeKm(36)).toBeCloseTo(200, 5);
  });

  it("0 kWh → 0 km", () => {
    expect(estimateRangeKm(0)).toBe(0);
  });

  it("scales linearly", () => {
    const r1 = estimateRangeKm(9);
    const r2 = estimateRangeKm(18);
    expect(r2).toBeCloseTo(r1 * 2, 5);
  });
});

// ─────────────────────────────────────────────────────────────────
// usableEnergyKwh
// ─────────────────────────────────────────────────────────────────

describe("usableEnergyKwh", () => {
  it("80% SoC → 10% min gives 70% of 60 kWh = 42 kWh", () => {
    expect(usableEnergyKwh(60, 80, 10)).toBeCloseTo(42, 5);
  });

  it("clamps to 0 when current <= min", () => {
    expect(usableEnergyKwh(60, 10, 10)).toBe(0);
    expect(usableEnergyKwh(60, 5, 10)).toBe(0);
  });

  it("100% SoC → 0% min gives full battery capacity", () => {
    expect(usableEnergyKwh(100, 100, 0)).toBeCloseTo(100, 5);
  });

  it("handles small delta", () => {
    expect(usableEnergyKwh(60, 21, 20)).toBeCloseTo(0.6, 5);
  });
});

// ─────────────────────────────────────────────────────────────────
// energyForDistanceKwh
// ─────────────────────────────────────────────────────────────────

describe("energyForDistanceKwh", () => {
  it("100 km needs 18 kWh", () => {
    expect(energyForDistanceKwh(100)).toBeCloseTo(18, 5);
  });

  it("200 km needs 36 kWh", () => {
    expect(energyForDistanceKwh(200)).toBeCloseTo(36, 5);
  });

  it("0 km needs 0 kWh", () => {
    expect(energyForDistanceKwh(0)).toBe(0);
  });

  it("is proportional to distance", () => {
    expect(energyForDistanceKwh(50)).toBeCloseTo(energyForDistanceKwh(100) / 2, 5);
  });
});

// ─────────────────────────────────────────────────────────────────
// estimateTravelMinutes
// ─────────────────────────────────────────────────────────────────

describe("estimateTravelMinutes", () => {
  it("100 km at 100 km/h = 60 min", () => {
    expect(estimateTravelMinutes(100)).toBe(60);
  });

  it("0 km = 0 min", () => {
    expect(estimateTravelMinutes(0)).toBe(0);
  });

  it("200 km = 120 min", () => {
    expect(estimateTravelMinutes(200)).toBe(120);
  });

  it("returns an integer (rounds)", () => {
    const result = estimateTravelMinutes(50);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// validateRouteInput
// ─────────────────────────────────────────────────────────────────

const VALID_INPUT = {
  startLat: 52.52,
  startLng: 13.405,
  startName: "Berlin",
  endLat: 48.137,
  endLng: 11.576,
  endName: "München",
  batteryCapacityKwh: 60,
  currentSocPercent: 80,
  minArrivalSocPercent: 10,
};

describe("validateRouteInput — valid input", () => {
  it("returns data and no errors for valid input", () => {
    const result = validateRouteInput(VALID_INPUT);
    expect(result.errors).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it("populated data fields match input", () => {
    const result = validateRouteInput(VALID_INPUT);
    if (!result.data) throw new Error("Expected data");
    expect(result.data.startLat).toBe(52.52);
    expect(result.data.endName).toBe("München");
    expect(result.data.batteryCapacityKwh).toBe(60);
  });

  it("defaults startName from coords when missing", () => {
    const { startName, ...rest } = VALID_INPUT;
    const result = validateRouteInput(rest);
    expect(result.errors).toBeNull();
    if (!result.data) throw new Error("Expected data");
    expect(result.data.startName).toContain("52.52");
  });
  it("defaults endName from coords when missing", () => {
    const { endName, ...rest } = VALID_INPUT;
    const result = validateRouteInput(rest);
    expect(result.errors).toBeNull();
    if (!result.data) throw new Error();
    expect(result.data.endName).toContain("48.137");
  });
  it("defaults minArrivalSocPercent to 10 when not provided", () => {
    const { minArrivalSocPercent, ...rest } = VALID_INPUT;
    const result = validateRouteInput(rest);
    expect(result.errors).toBeNull();
    if (!result.data) throw new Error("Expected data");
    expect(result.data.minArrivalSocPercent).toBe(10);
  });
});

describe("validateRouteInput — invalid lat/lng", () => {
  it("rejects startLat > 90", () => {
    const result = validateRouteInput({ ...VALID_INPUT, startLat: 91 });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "startLat")).toBe(true);
  });

  it("rejects startLat < -90", () => {
    const result = validateRouteInput({ ...VALID_INPUT, startLat: -91 });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "startLat")).toBe(true);
  });

  it("rejects NaN startLat", () => {
    const result = validateRouteInput({ ...VALID_INPUT, startLat: NaN });
    expect(result.data).toBeNull();
  });

  it("rejects startLng > 180", () => {
    const result = validateRouteInput({ ...VALID_INPUT, startLng: 181 });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "startLng")).toBe(true);
  });

  it("rejects endLat out of range", () => {
    const result = validateRouteInput({ ...VALID_INPUT, endLat: 100 });
    expect(result.data).toBeNull();
  });

  it("rejects endLng out of range", () => {
    const result = validateRouteInput({ ...VALID_INPUT, endLng: -200 });
    expect(result.data).toBeNull();
  });
});

describe("validateRouteInput — invalid battery/SoC", () => {
  it("rejects batteryCapacityKwh <= 0", () => {
    const result = validateRouteInput({ ...VALID_INPUT, batteryCapacityKwh: 0 });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "batteryCapacityKwh")).toBe(true);
  });

  it("rejects batteryCapacityKwh > 300", () => {
    const result = validateRouteInput({ ...VALID_INPUT, batteryCapacityKwh: 301 });
    expect(result.data).toBeNull();
  });

  it("rejects currentSocPercent < 0", () => {
    const result = validateRouteInput({ ...VALID_INPUT, currentSocPercent: -1 });
    expect(result.data).toBeNull();
  });

  it("rejects currentSocPercent > 100", () => {
    const result = validateRouteInput({ ...VALID_INPUT, currentSocPercent: 101 });
    expect(result.data).toBeNull();
  });

  it("rejects minArrivalSocPercent >= currentSocPercent", () => {
    const result = validateRouteInput({
      ...VALID_INPUT,
      currentSocPercent: 30,
      minArrivalSocPercent: 30,
    });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "minArrivalSocPercent")).toBe(true);
  });

  it("rejects minArrivalSocPercent > currentSocPercent", () => {
    const result = validateRouteInput({
      ...VALID_INPUT,
      currentSocPercent: 20,
      minArrivalSocPercent: 50,
    });
    expect(result.data).toBeNull();
  });

  it("rejects minArrivalSocPercent < 0", () => {
    const result = validateRouteInput({ ...VALID_INPUT, minArrivalSocPercent: -1 });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "minArrivalSocPercent")).toBe(true);
  });

  it("rejects minArrivalSocPercent > 100", () => {
    const result = validateRouteInput({ ...VALID_INPUT, minArrivalSocPercent: 101 });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "minArrivalSocPercent")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// validateReportPayload
// ─────────────────────────────────────────────────────────────────

const VALID_REPORT = {
  stationId: "abc123",
  reportType: "available",
  lat: 52.52,
  lng: 13.405,
  description: "Alles gut",
  priceKwh: 0.45,
};

describe("validateReportPayload — valid input", () => {
  it("returns data and no errors for valid input", () => {
    const result = validateReportPayload(VALID_REPORT);
    expect(result.errors).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it("trims stationId", () => {
    const result = validateReportPayload({ ...VALID_REPORT, stationId: "  abc  " });
    expect(result.errors).toBeNull();
    if (!result.data) throw new Error();
    expect(result.data.stationId).toBe("abc");
  });

  it("accepts all valid report types", () => {
    for (const type of ["available", "occupied", "defect", "price", "other"]) {
      const result = validateReportPayload({ ...VALID_REPORT, reportType: type });
      expect(result.errors).toBeNull();
    }
  });

  it("accepts optional fields as undefined", () => {
    const result = validateReportPayload({ stationId: "x", reportType: "defect" });
    expect(result.errors).toBeNull();
  });
});

describe("validateReportPayload — invalid input", () => {
  it("rejects null body", () => {
    const result = validateReportPayload(null);
    expect(result.data).toBeNull();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it("rejects non-object body", () => {
    const result = validateReportPayload("string");
    expect(result.data).toBeNull();
  });

  it("rejects missing stationId", () => {
    const { stationId, ...rest } = VALID_REPORT;
    const result = validateReportPayload(rest);
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "stationId")).toBe(true);
  });

  it("rejects empty stationId", () => {
    const result = validateReportPayload({ ...VALID_REPORT, stationId: "   " });
    expect(result.data).toBeNull();
  });

  it("rejects invalid reportType", () => {
    const result = validateReportPayload({ ...VALID_REPORT, reportType: "broken" });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "reportType")).toBe(true);
  });

  it("rejects lat out of range", () => {
    const result = validateReportPayload({ ...VALID_REPORT, lat: 91 });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "lat")).toBe(true);
  });

  it("rejects lat < -90", () => {
    const result = validateReportPayload({ ...VALID_REPORT, lat: -91 });
    expect(result.data).toBeNull();
  });

  it("rejects lng > 180", () => {
    const result = validateReportPayload({ ...VALID_REPORT, lng: 181 });
    expect(result.data).toBeNull();
  });

  it("rejects description as non-string", () => {
    const result = validateReportPayload({ ...VALID_REPORT, description: 123 });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "description")).toBe(true);
  });

  it("rejects description longer than 500 chars", () => {
    const result = validateReportPayload({
      ...VALID_REPORT,
      description: "x".repeat(501),
    });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "description")).toBe(true);
  });

  it("accepts description at exactly 500 chars", () => {
    const result = validateReportPayload({
      ...VALID_REPORT,
      description: "x".repeat(500),
    });
    expect(result.errors).toBeNull();
  });

  it("rejects priceKwh < 0", () => {
    const result = validateReportPayload({ ...VALID_REPORT, priceKwh: -0.1 });
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "priceKwh")).toBe(true);
  });

  it("rejects priceKwh > 10", () => {
    const result = validateReportPayload({ ...VALID_REPORT, priceKwh: 10.01 });
    expect(result.data).toBeNull();
  });

  it("accepts priceKwh at boundary 0", () => {
    const result = validateReportPayload({ ...VALID_REPORT, priceKwh: 0 });
    expect(result.errors).toBeNull();
  });

  it("accepts priceKwh at boundary 10", () => {
    const result = validateReportPayload({ ...VALID_REPORT, priceKwh: 10 });
    expect(result.errors).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────
// validateStationsQuery
// ─────────────────────────────────────────────────────────────────

function makeParams(obj: Record<string, string>): URLSearchParams {
  return new URLSearchParams(obj);
}

describe("validateStationsQuery — valid input", () => {
  it("returns data for minimal valid input", () => {
    const result = validateStationsQuery(makeParams({ lat: "52.52", lng: "13.405" }));
    expect(result.errors).toBeNull();
    if (!result.data) throw new Error();
    expect(result.data.lat).toBe(52.52);
    expect(result.data.lng).toBe(13.405);
  });

  it("uses defaults for distance and maxResults", () => {
    const result = validateStationsQuery(makeParams({ lat: "52.52", lng: "13.405" }));
    expect(result.errors).toBeNull();
    if (!result.data) throw new Error();
    expect(result.data.distance).toBe(25);
    expect(result.data.maxResults).toBe(100);
  });

  it("accepts valid powerLevel: ac", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", powerLevel: "ac" }),
    );
    expect(result.errors).toBeNull();
  });

  it("accepts valid powerLevel: dc", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", powerLevel: "dc" }),
    );
    expect(result.errors).toBeNull();
  });

  it("accepts valid powerLevel: hpc", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", powerLevel: "hpc" }),
    );
    expect(result.errors).toBeNull();
  });

  it("accepts all valid connectorTypes", () => {
    for (const ct of ["type2", "ccs", "chademo", "tesla_ccs"]) {
      const result = validateStationsQuery(
        makeParams({ lat: "52.52", lng: "13.405", connectorType: ct }),
      );
      expect(result.errors).toBeNull();
    }
  });
});

describe("validateStationsQuery — invalid input", () => {
  it("rejects missing lat", () => {
    const result = validateStationsQuery(makeParams({ lng: "13.405" }));
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "lat")).toBe(true);
  });

  it("rejects missing lng", () => {
    const result = validateStationsQuery(makeParams({ lat: "52.52" }));
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "lng")).toBe(true);
  });

  it("rejects lat > 90", () => {
    const result = validateStationsQuery(makeParams({ lat: "91", lng: "13.405" }));
    expect(result.data).toBeNull();
  });

  it("rejects lat < -90", () => {
    const result = validateStationsQuery(makeParams({ lat: "-91", lng: "13.405" }));
    expect(result.data).toBeNull();
  });

  it("rejects lng > 180", () => {
    const result = validateStationsQuery(makeParams({ lat: "52", lng: "181" }));
    expect(result.data).toBeNull();
  });

  it("rejects distance = 0", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", distance: "0" }),
    );
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "distance")).toBe(true);
  });

  it("rejects distance > 500", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", distance: "501" }),
    );
    expect(result.data).toBeNull();
  });

  it("rejects maxResults < 1", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", maxResults: "0" }),
    );
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "maxResults")).toBe(true);
  });

  it("rejects maxResults > 500", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", maxResults: "501" }),
    );
    expect(result.data).toBeNull();
  });

  it("rejects invalid powerLevel", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", powerLevel: "turbo" }),
    );
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "powerLevel")).toBe(true);
  });

  it("rejects invalid connectorType", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", connectorType: "android" }),
    );
    expect(result.data).toBeNull();
    expect(result.errors?.some((e) => e.field === "connectorType")).toBe(true);
  });

  it("accepts distance at boundary 500", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", distance: "500" }),
    );
    expect(result.errors).toBeNull();
  });

  it("accepts maxResults at boundary 500", () => {
    const result = validateStationsQuery(
      makeParams({ lat: "52.52", lng: "13.405", maxResults: "500" }),
    );
    expect(result.errors).toBeNull();
  });
});
