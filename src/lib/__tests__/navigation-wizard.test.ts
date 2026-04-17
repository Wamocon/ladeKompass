/**
 * Tests for NavigationWizard helper logic:
 * - fmtDist: distance formatting
 * - fmtTime: duration formatting
 * - ManeuverIcon mapping (type discrimination)
 * - OSRM response parsing (shape validation)
 */

// ─── Inline helpers (same logic as in NavigationWizard.tsx) ─────────────────

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function fmtTime(s: number): string {
  const min = Math.round(s / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}m`;
}

function maneuverIconType(type: string, modifier?: string): string {
  if (type === "turn") {
    if (modifier === "left" || modifier === "sharp left" || modifier === "slight left") return "arrow-left";
    if (modifier === "right" || modifier === "sharp right" || modifier === "slight right") return "arrow-right";
  }
  if (type === "roundabout" || type === "rotary") return "rotate-ccw";
  if (type === "on ramp") return "corner-up-right";
  if (type === "off ramp") return "corner-up-left";
  return "arrow-up";
}

// ─── OsrmRoute shape expected from API ──────────────────────────────────────

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: { type: "LineString"; coordinates: [number, number][] };
  steps: Array<{
    maneuver: { type: string; modifier?: string };
    name: string;
    distance: number;
    duration: number;
  }>;
}

function parseOsrmResponse(json: unknown): OsrmRoute | null {
  if (
    typeof json !== "object" ||
    json === null ||
    !("routes" in json) ||
    !Array.isArray((json as { routes: unknown }).routes) ||
    (json as { routes: unknown[] }).routes.length === 0
  ) {
    return null;
  }
  const raw = (json as { routes: unknown[] }).routes[0] as {
    distance: number;
    duration: number;
    geometry: { type: string; coordinates: [number, number][] };
    legs?: Array<{ steps?: OsrmRoute["steps"] }>;
  };
  const steps: OsrmRoute["steps"] = (raw.legs ?? []).flatMap((leg) => leg.steps ?? []);
  return {
    distance: raw.distance,
    duration: raw.duration,
    geometry: raw.geometry as { type: "LineString"; coordinates: [number, number][] },
    steps,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("fmtDist", () => {
  it("formats metres below 1000", () => {
    expect(fmtDist(0)).toBe("0 m");
    expect(fmtDist(150)).toBe("150 m");
    expect(fmtDist(999)).toBe("999 m");
  });

  it("formats km at threshold", () => {
    expect(fmtDist(1000)).toBe("1.0 km");
    expect(fmtDist(1500)).toBe("1.5 km");
    expect(fmtDist(23456)).toBe("23.5 km");
    expect(fmtDist(100000)).toBe("100.0 km");
  });

  it("rounds metres", () => {
    expect(fmtDist(149.6)).toBe("150 m");
    expect(fmtDist(0.4)).toBe("0 m");
  });
});

describe("fmtTime", () => {
  it("formats durations below 1 hour in minutes", () => {
    expect(fmtTime(0)).toBe("0 min");
    expect(fmtTime(60)).toBe("1 min");
    expect(fmtTime(3540)).toBe("59 min");
  });

  it("formats durations of exactly 1 hour", () => {
    expect(fmtTime(3600)).toBe("1h 0m");
  });

  it("formats durations above 1 hour", () => {
    expect(fmtTime(3660)).toBe("1h 1m");
    expect(fmtTime(7200)).toBe("2h 0m");
    expect(fmtTime(7320)).toBe("2h 2m");
    expect(fmtTime(9000)).toBe("2h 30m");
  });
});

describe("maneuverIconType", () => {
  it("straight directions → arrow-up", () => {
    expect(maneuverIconType("depart")).toBe("arrow-up");
    expect(maneuverIconType("arrive")).toBe("arrow-up");
    expect(maneuverIconType("continue")).toBe("arrow-up");
  });

  it("left turns", () => {
    expect(maneuverIconType("turn", "left")).toBe("arrow-left");
    expect(maneuverIconType("turn", "sharp left")).toBe("arrow-left");
    expect(maneuverIconType("turn", "slight left")).toBe("arrow-left");
  });

  it("right turns", () => {
    expect(maneuverIconType("turn", "right")).toBe("arrow-right");
    expect(maneuverIconType("turn", "sharp right")).toBe("arrow-right");
    expect(maneuverIconType("turn", "slight right")).toBe("arrow-right");
  });

  it("roundabouts and rotaries", () => {
    expect(maneuverIconType("roundabout")).toBe("rotate-ccw");
    expect(maneuverIconType("rotary")).toBe("rotate-ccw");
  });

  it("ramps", () => {
    expect(maneuverIconType("on ramp")).toBe("corner-up-right");
    expect(maneuverIconType("off ramp")).toBe("corner-up-left");
  });

  it("unknown type → arrow-up", () => {
    expect(maneuverIconType("fork", "left")).toBe("arrow-up");
    expect(maneuverIconType("merge")).toBe("arrow-up");
  });
});

describe("parseOsrmResponse", () => {
  const mockOsrmJson = {
    code: "Ok",
    routes: [
      {
        distance: 42000,
        duration: 1800,
        geometry: {
          type: "LineString",
          coordinates: [
            [10.0, 51.0],
            [10.5, 51.5],
            [11.0, 52.0],
          ],
        },
        legs: [
          {
            steps: [
              { maneuver: { type: "depart" }, name: "Hauptstraße", distance: 500, duration: 60 },
              { maneuver: { type: "turn", modifier: "left" }, name: "Nebenweg", distance: 200, duration: 30 },
              { maneuver: { type: "arrive" }, name: "", distance: 0, duration: 0 },
            ],
          },
        ],
      },
    ],
  };

  it("parses a valid OSRM response", () => {
    const result = parseOsrmResponse(mockOsrmJson);
    expect(result).not.toBeNull();
    expect(result!.distance).toBe(42000);
    expect(result!.duration).toBe(1800);
    expect(result!.geometry.type).toBe("LineString");
    expect(result!.geometry.coordinates).toHaveLength(3);
  });

  it("extracts steps from legs", () => {
    const result = parseOsrmResponse(mockOsrmJson);
    expect(result!.steps).toHaveLength(3);
    expect(result!.steps[0].maneuver.type).toBe("depart");
    expect(result!.steps[1].maneuver.modifier).toBe("left");
    expect(result!.steps[1].name).toBe("Nebenweg");
  });

  it("returns null for empty routes array", () => {
    expect(parseOsrmResponse({ code: "Ok", routes: [] })).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseOsrmResponse(null)).toBeNull();
    expect(parseOsrmResponse("string")).toBeNull();
    expect(parseOsrmResponse(42)).toBeNull();
  });

  it("returns null when routes key is missing", () => {
    expect(parseOsrmResponse({ code: "NoRoute" })).toBeNull();
  });

  it("handles multi-leg routes by flattening steps", () => {
    const multiLeg = {
      routes: [
        {
          distance: 100000,
          duration: 5400,
          geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
          legs: [
            { steps: [{ maneuver: { type: "depart" }, name: "A", distance: 0, duration: 0 }] },
            { steps: [{ maneuver: { type: "arrive" }, name: "B", distance: 0, duration: 0 }] },
          ],
        },
      ],
    };
    const result = parseOsrmResponse(multiLeg);
    expect(result!.steps).toHaveLength(2);
  });

  it("handles missing legs gracefully", () => {
    const noLegs = {
      routes: [
        {
          distance: 5000,
          duration: 600,
          geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
        },
      ],
    };
    const result = parseOsrmResponse(noLegs);
    expect(result).not.toBeNull();
    expect(result!.steps).toHaveLength(0);
  });
});
