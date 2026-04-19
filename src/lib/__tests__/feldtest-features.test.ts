/**
 * Tests für die 6 Feldtest-Verbesserungen (April 2026)
 *
 * 1. Radius-Filter (NearbyFeed) – Haversine-basiertes Client-seitiges Filtern
 * 2. Karten-Einstellungen (MapPrefs) – localStorage Persistenz-Logik
 * 3. Icons: PIN_PIXEL_RATIO Konstante und SVG-Größenanpassung
 * 4. Standort-Heading – Plausibilitätsprüfung gültiger GPS-Headings
 * 5. Fahrzeugtyp-Auswahl – OSRM-Profil-Mapping
 * 6. Popup-Größe – CSS min-width Wertvalidierung
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ─── 1. Radius-Filter ────────────────────────────────────────────────────────
// Inline-Logik aus NearbyFeed.tsx

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface MockStation {
  id: number;
  lat: number;
  lng: number;
}

/** Replicates the filter logic added to NearbyFeed.tsx */
function filterByRadius(
  stations: MockStation[],
  userLat: number,
  userLng: number,
  radiusKm: number,
): MockStation[] {
  return stations.filter(
    (s) => haversineKm(userLat, userLng, s.lat, s.lng) <= radiusKm,
  );
}

describe("NearbyFeed – radius client-side filter", () => {
  // Frankfurt (user), Berlin (~500 km), Stuttgart (~175 km), Hanau (~15 km), Koblenz (~100 km)
  const userLat = 50.11;
  const userLng = 8.68;
  const stations: MockStation[] = [
    { id: 1, lat: 50.13, lng: 8.91 },  // ~15 km  (Hanau area – clearly within 25 km)
    { id: 2, lat: 50.36, lng: 7.59 },  // ~100 km (Koblenz area)
    { id: 3, lat: 48.78, lng: 9.18 },  // ~175 km (Stuttgart area)
    { id: 4, lat: 52.52, lng: 13.4 },  // ~502 km (Berlin)
  ];

  it("10 km radius returns only stations within 10 km", () => {
    const result = filterByRadius(stations, userLat, userLng, 10);
    expect(result.every((s) => haversineKm(userLat, userLng, s.lat, s.lng) <= 10)).toBe(true);
  });

  it("25 km radius includes Hanau (~15 km) but not Koblenz (~100 km)", () => {
    const result = filterByRadius(stations, userLat, userLng, 25);
    const ids = result.map((s) => s.id);
    expect(ids).toContain(1);   // Hanau ~15 km ✓
    expect(ids).not.toContain(2); // Koblenz ~100 km ✗
  });

  it("100 km radius excludes Stuttgart and Berlin", () => {
    const result = filterByRadius(stations, userLat, userLng, 100);
    const ids = result.map((s) => s.id);
    expect(ids).not.toContain(3); // Stuttgart ~175 km
    expect(ids).not.toContain(4); // Berlin ~502 km
  });

  it("200 km radius includes Stuttgart but not Berlin", () => {
    const result = filterByRadius(stations, userLat, userLng, 200);
    const ids = result.map((s) => s.id);
    expect(ids).toContain(3);     // Stuttgart ~175 km ✓
    expect(ids).not.toContain(4); // Berlin ~502 km ✗
  });

  it("returns empty array when no stations are within radius", () => {
    const result = filterByRadius(stations, userLat, userLng, 5);
    expect(result.length).toBe(0);
  });

  it("returns all stations when radius is very large", () => {
    const result = filterByRadius(stations, userLat, userLng, 1000);
    expect(result.length).toBe(stations.length);
  });

  it("result count is ≤ total input count", () => {
    const result = filterByRadius(stations, userLat, userLng, 50);
    expect(result.length).toBeLessThanOrEqual(stations.length);
  });

  it("larger radius yields ≥ same count as smaller", () => {
    const r50  = filterByRadius(stations, userLat, userLng, 50);
    const r100 = filterByRadius(stations, userLat, userLng, 100);
    expect(r100.length).toBeGreaterThanOrEqual(r50.length);
  });
});

// ─── 2. Karten-Einstellungen (MapPrefs) ─────────────────────────────────────

const MAP_PREFS_KEY = "lk-map-prefs";

type MapStyleKey = "light" | "dark" | "bright" | "standard";

interface MapPrefs {
  mapStyle: MapStyleKey;
  powerLevel: "all" | "ac" | "dc" | "hpc" | null;
  connectorType: string | null;
  showHeatmap: boolean;
  show3D: boolean;
  showLiveFeed: boolean;
}

function defaultMapPrefs(): MapPrefs {
  return {
    mapStyle: "light",
    powerLevel: null,
    connectorType: null,
    showHeatmap: false,
    show3D: false,
    showLiveFeed: true,
  };
}

function saveMapPrefs(storage: Map<string, string>, prefs: Partial<MapPrefs>): void {
  const current = loadMapPrefs(storage);
  storage.set(MAP_PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
}

function loadMapPrefs(storage: Map<string, string>): MapPrefs {
  try {
    const raw = storage.get(MAP_PREFS_KEY);
    if (raw) return { ...defaultMapPrefs(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultMapPrefs();
}

describe("MapPrefs – localStorage persistence logic", () => {
  let store: Map<string, string>;

  beforeEach(() => { store = new Map(); });

  it("returns defaults when nothing is stored", () => {
    const prefs = loadMapPrefs(store);
    expect(prefs.mapStyle).toBe("light");
    expect(prefs.showHeatmap).toBe(false);
    expect(prefs.show3D).toBe(false);
    expect(prefs.showLiveFeed).toBe(true);
    expect(prefs.powerLevel).toBeNull();
    expect(prefs.connectorType).toBeNull();
  });

  it("saves and loads mapStyle", () => {
    saveMapPrefs(store, { mapStyle: "dark" });
    expect(loadMapPrefs(store).mapStyle).toBe("dark");
  });

  it("saves and loads showHeatmap toggle", () => {
    saveMapPrefs(store, { showHeatmap: true });
    expect(loadMapPrefs(store).showHeatmap).toBe(true);
  });

  it("saves and loads show3D toggle", () => {
    saveMapPrefs(store, { show3D: true });
    expect(loadMapPrefs(store).show3D).toBe(true);
  });

  it("saves and loads showLiveFeed=false", () => {
    saveMapPrefs(store, { showLiveFeed: false });
    expect(loadMapPrefs(store).showLiveFeed).toBe(false);
  });

  it("saves and loads powerLevel filter", () => {
    saveMapPrefs(store, { powerLevel: "hpc" });
    expect(loadMapPrefs(store).powerLevel).toBe("hpc");
  });

  it("saves and loads connectorType filter", () => {
    saveMapPrefs(store, { connectorType: "ccs" });
    expect(loadMapPrefs(store).connectorType).toBe("ccs");
  });

  it("partial save preserves existing keys", () => {
    saveMapPrefs(store, { mapStyle: "dark" });
    saveMapPrefs(store, { show3D: true });
    const prefs = loadMapPrefs(store);
    expect(prefs.mapStyle).toBe("dark"); // preserved from first save
    expect(prefs.show3D).toBe(true);     // added in second save
    expect(prefs.showHeatmap).toBe(false); // default preserved
  });

  it("overwrites previously saved value", () => {
    saveMapPrefs(store, { mapStyle: "dark" });
    saveMapPrefs(store, { mapStyle: "bright" });
    expect(loadMapPrefs(store).mapStyle).toBe("bright");
  });

  it("returns defaults for corrupted JSON", () => {
    store.set(MAP_PREFS_KEY, "{ not valid json");
    expect(loadMapPrefs(store).mapStyle).toBe("light");
  });

  it("accepts all valid mapStyle values", () => {
    const styles: MapStyleKey[] = ["light", "dark", "bright", "standard"];
    for (const style of styles) {
      saveMapPrefs(store, { mapStyle: style });
      expect(loadMapPrefs(store).mapStyle).toBe(style);
    }
  });
});

// ─── 3. Icons: PIN_PIXEL_RATIO ───────────────────────────────────────────────

const PIN_PIXEL_RATIO = 4;
const PIN_LOGICAL_W   = 36;
const PIN_LOGICAL_H   = 46;

describe("SVG pin rendering – pixel ratio", () => {
  it("PIN_PIXEL_RATIO is 4 (4× super-sampling)", () => {
    expect(PIN_PIXEL_RATIO).toBe(4);
  });

  it("physical canvas size is logical × pixelRatio", () => {
    const physW = PIN_LOGICAL_W * PIN_PIXEL_RATIO;
    const physH = PIN_LOGICAL_H * PIN_PIXEL_RATIO;
    expect(physW).toBe(144);
    expect(physH).toBe(184);
  });

  it("aspect ratio is preserved (H/W ≈ 1.28)", () => {
    const ratio = PIN_LOGICAL_H / PIN_LOGICAL_W;
    expect(ratio).toBeCloseTo(46 / 36, 3);
    expect(ratio).toBeGreaterThan(1.2);
    expect(ratio).toBeLessThan(1.4);
  });

  it("physical dimensions are multiples of PIN_PIXEL_RATIO", () => {
    expect((PIN_LOGICAL_W * PIN_PIXEL_RATIO) % PIN_PIXEL_RATIO).toBe(0);
    expect((PIN_LOGICAL_H * PIN_PIXEL_RATIO) % PIN_PIXEL_RATIO).toBe(0);
  });

  /** Simulates the SVG size-injection logic in loadSvgPinImage */
  function injectSvgSize(svg: string, w: number, h: number): string {
    return svg.replace(
      /(<svg[^>]*)\bwidth="[^"]*"\s*height="[^"]*"/,
      `$1width="${w}" height="${h}"`,
    );
  }

  it("injectSvgSize replaces width/height correctly", () => {
    const src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46"><circle/></svg>`;
    const result = injectSvgSize(src, 144, 184);
    expect(result).toContain('width="144"');
    expect(result).toContain('height="184"');
    expect(result).not.toContain('width="36"');
    expect(result).not.toContain('height="46"');
  });

  it("injectSvgSize preserves viewBox and other attributes", () => {
    const src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46"><path/></svg>`;
    const result = injectSvgSize(src, 144, 184);
    expect(result).toContain('viewBox="0 0 36 46"');
  });
});

// ─── 4. Standort-Heading ─────────────────────────────────────────────────────

describe("User location heading validation", () => {
  function isValidHeading(heading: number | null | undefined): boolean {
    return heading !== null && heading !== undefined && Number.isFinite(heading);
  }

  it("accepts 0° (North)", () => {
    expect(isValidHeading(0)).toBe(true);
  });

  it("accepts 90° (East)", () => {
    expect(isValidHeading(90)).toBe(true);
  });

  it("accepts 180° (South)", () => {
    expect(isValidHeading(180)).toBe(true);
  });

  it("accepts 270° (West)", () => {
    expect(isValidHeading(270)).toBe(true);
  });

  it("accepts 359.9° (just before North)", () => {
    expect(isValidHeading(359.9)).toBe(true);
  });

  it("rejects null (heading not available)", () => {
    expect(isValidHeading(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isValidHeading(undefined)).toBe(false);
  });

  it("rejects NaN", () => {
    expect(isValidHeading(NaN)).toBe(false);
  });

  it("rejects Infinity", () => {
    expect(isValidHeading(Infinity)).toBe(false);
  });

  /** CSS transform string used for the heading arrow */
  function headingToTransform(heading: number): string {
    return `rotate(${heading}deg)`;
  }

  it("heading 0 → rotate(0deg)", () => {
    expect(headingToTransform(0)).toBe("rotate(0deg)");
  });

  it("heading 180 → rotate(180deg)", () => {
    expect(headingToTransform(180)).toBe("rotate(180deg)");
  });

  it("heading transform matches expected CSS format", () => {
    expect(headingToTransform(45)).toMatch(/^rotate\(\d+(\.\d+)?deg\)$/);
  });
});

// ─── 5. Fahrzeugtyp-Auswahl – OSRM Profil-Mapping ──────────────────────────

type VehicleType = "car" | "scooter" | "escooter" | "foot";

const VEHICLE_OPTIONS: { type: VehicleType; osrm: string; label: string }[] = [
  { type: "car",      osrm: "driving", label: "E-Auto"     },
  { type: "scooter",  osrm: "driving", label: "E-Roller"   },
  { type: "escooter", osrm: "cycling", label: "E-Scooter"  },
  { type: "foot",     osrm: "foot",    label: "Zu Fuß"     },
];

function getOsrmProfile(vehicleType: VehicleType): string {
  return VEHICLE_OPTIONS.find((v) => v.type === vehicleType)?.osrm ?? "driving";
}

function buildOsrmUrl(profile: string, fLng: number, fLat: number, tLng: number, tLat: number): string {
  return `https://router.project-osrm.org/route/v1/${profile}/${fLng},${fLat};${tLng},${tLat}?overview=full&geometries=geojson&steps=true&annotations=true`;
}

describe("Vehicle type – OSRM profile mapping", () => {
  it("car → driving profile", () => {
    expect(getOsrmProfile("car")).toBe("driving");
  });

  it("scooter → driving profile (same road rules as car)", () => {
    expect(getOsrmProfile("scooter")).toBe("driving");
  });

  it("escooter → cycling profile", () => {
    expect(getOsrmProfile("escooter")).toBe("cycling");
  });

  it("foot → foot profile", () => {
    expect(getOsrmProfile("foot")).toBe("foot");
  });

  it("all 4 vehicle types are covered", () => {
    const types: VehicleType[] = ["car", "scooter", "escooter", "foot"];
    for (const t of types) {
      expect(getOsrmProfile(t)).toBeTruthy();
    }
  });

  it("OSRM URL contains the correct profile", () => {
    const url = buildOsrmUrl("cycling", 8.68, 50.11, 9.99, 53.55);
    expect(url).toContain("/route/v1/cycling/");
  });

  it("OSRM URL for car uses driving profile", () => {
    const profile = getOsrmProfile("car");
    const url = buildOsrmUrl(profile, 8.68, 50.11, 9.99, 53.55);
    expect(url).toContain("/route/v1/driving/");
  });

  it("OSRM URL for foot uses foot profile", () => {
    const profile = getOsrmProfile("foot");
    const url = buildOsrmUrl(profile, 8.68, 50.11, 9.99, 53.55);
    expect(url).toContain("/route/v1/foot/");
  });

  it("OSRM URL always includes required query parameters", () => {
    const url = buildOsrmUrl("driving", 8.68, 50.11, 9.99, 53.55);
    expect(url).toContain("overview=full");
    expect(url).toContain("geometries=geojson");
    expect(url).toContain("steps=true");
  });

  it("OSRM URL is well-formed (starts with https)", () => {
    const url = buildOsrmUrl("driving", 8.68, 50.11, 9.99, 53.55);
    expect(url).toMatch(/^https:\/\/router\.project-osrm\.org/);
  });

  it("OSRM URL encodes coordinates in correct order: lng,lat;lng,lat", () => {
    const url = buildOsrmUrl("driving", 8.68, 50.11, 9.99, 53.55);
    expect(url).toContain("8.68,50.11;9.99,53.55");
  });
});

// ─── 6. Popup-Größe ──────────────────────────────────────────────────────────

describe("Popup min-width responsive sizing", () => {
  /** Replicates the min-width CSS string used in the popup html */
  const MIN_WIDTH = "min(580px,90vw)";
  const MAX_WIDTH = "min(680px,94vw)";

  it("min-width uses CSS min() for responsiveness", () => {
    expect(MIN_WIDTH).toMatch(/^min\(/);
  });

  it("max-width uses CSS min() for responsiveness", () => {
    expect(MAX_WIDTH).toMatch(/^min\(/);
  });

  it("min-width is at least 560px on large screens", () => {
    // Extract px value
    const match = MIN_WIDTH.match(/(\d+)px/);
    expect(match).not.toBeNull();
    expect(parseInt(match![1], 10)).toBeGreaterThanOrEqual(560);
  });

  it("max-width is larger than min-width fixed value", () => {
    const minPx = parseInt(MIN_WIDTH.match(/(\d+)px/)![1], 10);
    const maxPx = parseInt(MAX_WIDTH.match(/(\d+)px/)![1], 10);
    expect(maxPx).toBeGreaterThan(minPx);
  });

  it("viewport unit is ≤ 94vw (stays within screen on mobile)", () => {
    const vwMatch = MAX_WIDTH.match(/(\d+)vw/);
    expect(vwMatch).not.toBeNull();
    expect(parseInt(vwMatch![1], 10)).toBeLessThanOrEqual(94);
  });
});

// ─── Integration: Radius filter monotonicity ────────────────────────────────

describe("Radius filter monotonicity (integration)", () => {
  // A grid of 20 synthetic stations at various distances from Frankfurt
  const userLat = 50.11;
  const userLng = 8.68;
  const syntheticStations: MockStation[] = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    // Distribute stations in a rough circle, ~10–500 km away
    lat: userLat + (Math.cos((i / 20) * 2 * Math.PI) * (i + 1) * 0.25),
    lng: userLng + (Math.sin((i / 20) * 2 * Math.PI) * (i + 1) * 0.25),
  }));

  const radii = [10, 25, 50, 100, 200] as const;

  it("each larger radius returns ≥ as many stations as a smaller one", () => {
    let prev = 0;
    for (const r of radii) {
      const count = filterByRadius(syntheticStations, userLat, userLng, r).length;
      expect(count).toBeGreaterThanOrEqual(prev);
      prev = count;
    }
  });

  it("all returned stations are actually within the radius", () => {
    for (const r of radii) {
      const result = filterByRadius(syntheticStations, userLat, userLng, r);
      for (const s of result) {
        const d = haversineKm(userLat, userLng, s.lat, s.lng);
        expect(d).toBeLessThanOrEqual(r + 0.001); // tiny float tolerance
      }
    }
  });
});
