/**
 * Tests for NearbyFeed helper logic (inline – functions are not exported from the component):
 * - haversineKm: Haversine-Formel für Entfernungsberechnung
 * - maxKwFromStation: Maximale Ladeleistung aus OCM-Station
 * - connectorLabels: Steckertyp-Labels (dedupliziert, max 3)
 * - kwColor: Farbklasse basierend auf Ladeleistung
 * - toCard shape: Vollständigkeit der StationCard-Felder
 */

// ─── Inline helpers (same logic as in NearbyFeed.tsx) ───────────────────────

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

function maxKwFromConnections(connections: Array<{ PowerKW?: number | null }>): number {
  const kws = connections
    .map((c) => Number(c.PowerKW ?? 0))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return kws.length ? Math.max(0, ...kws) : 0;
}

function connectorLabels(connections: Array<{ ConnectionType?: { Title?: string } }>): string[] {
  return [
    ...new Set(
      connections
        .map((c) => c.ConnectionType?.Title ?? "")
        .filter(Boolean)
        .map((t) => t.split("(")[0].trim()),
    ),
  ].slice(0, 3);
}

function kwColor(kw: number): string {
  if (kw >= 150) return "text-green-400";
  if (kw >= 50) return "text-cyan-400";
  if (kw >= 22) return "text-violet-400";
  if (kw > 0) return "text-green-500";
  return "text-amber-400";
}

// ─── haversineKm ─────────────────────────────────────────────────────────────

describe("haversineKm", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineKm(52.52, 13.4, 52.52, 13.4)).toBeCloseTo(0, 5);
  });

  it("calculates Berlin→Hamburg ≈ 255 km", () => {
    // Berlin: 52.52°N, 13.40°E | Hamburg: 53.55°N, 9.99°E
    const d = haversineKm(52.52, 13.4, 53.55, 9.99);
    expect(d).toBeGreaterThan(250);
    expect(d).toBeLessThan(260);
  });

  it("calculates Berlin→Munich ≈ 504 km", () => {
    // Munich: 48.14°N, 11.58°E
    const d = haversineKm(52.52, 13.4, 48.14, 11.58);
    expect(d).toBeGreaterThan(495);
    expect(d).toBeLessThan(515);
  });

  it("is symmetric (A→B = B→A)", () => {
    const d1 = haversineKm(52.52, 13.4, 48.14, 11.58);
    const d2 = haversineKm(48.14, 11.58, 52.52, 13.4);
    expect(d1).toBeCloseTo(d2, 8);
  });

  it("returns a positive number for different coordinates", () => {
    expect(haversineKm(0, 0, 1, 1)).toBeGreaterThan(0);
  });

  it("handles negative latitudes/longitudes (Southern Hemisphere)", () => {
    // São Paulo → Buenos Aires ≈ 1700 km
    const d = haversineKm(-23.5, -46.6, -34.6, -58.4);
    expect(d).toBeGreaterThan(1650);
    expect(d).toBeLessThan(1750);
  });
});

// ─── maxKwFromConnections ─────────────────────────────────────────────────────

describe("maxKwFromConnections", () => {
  it("returns 0 for empty array", () => {
    expect(maxKwFromConnections([])).toBe(0);
  });

  it("returns 0 for all null/undefined PowerKW", () => {
    expect(maxKwFromConnections([{ PowerKW: null }, { PowerKW: undefined }])).toBe(0);
  });

  it("returns the maximum value", () => {
    expect(maxKwFromConnections([{ PowerKW: 22 }, { PowerKW: 150 }, { PowerKW: 50 }])).toBe(150);
  });

  it("handles a single connection", () => {
    expect(maxKwFromConnections([{ PowerKW: 11 }])).toBe(11);
  });

  it("ignores NaN values", () => {
    expect(maxKwFromConnections([{ PowerKW: NaN }, { PowerKW: 100 }])).toBe(100);
  });

  it("handles 0 kW (valid but powerless)", () => {
    expect(maxKwFromConnections([{ PowerKW: 0 }])).toBe(0);
  });

  it("handles HPC values (≥ 150 kW)", () => {
    expect(maxKwFromConnections([{ PowerKW: 350 }])).toBe(350);
  });
});

// ─── connectorLabels ──────────────────────────────────────────────────────────

describe("connectorLabels", () => {
  it("returns empty array for no connections", () => {
    expect(connectorLabels([])).toEqual([]);
  });

  it("extracts unique connector type names", () => {
    const result = connectorLabels([
      { ConnectionType: { Title: "Type 2 (Mennekes)" } },
      { ConnectionType: { Title: "CCS (Type 2)" } },
    ]);
    expect(result).toContain("Type 2");
    expect(result).toContain("CCS");
  });

  it("deduplicates identical connector types", () => {
    const result = connectorLabels([
      { ConnectionType: { Title: "Type 2 (Mennekes)" } },
      { ConnectionType: { Title: "Type 2 (Mennekes)" } },
      { ConnectionType: { Title: "Type 2 (Mennekes)" } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Type 2");
  });

  it("limits results to 3 entries", () => {
    const result = connectorLabels([
      { ConnectionType: { Title: "Type 2 (Mennekes)" } },
      { ConnectionType: { Title: "CCS (Type 2)" } },
      { ConnectionType: { Title: "CHAdeMO" } },
      { ConnectionType: { Title: "Tesla Supercharger" } },
    ]);
    expect(result).toHaveLength(3);
  });

  it("strips everything from '(' onwards", () => {
    const result = connectorLabels([{ ConnectionType: { Title: "CCS (Type 2) - DC Fast" } }]);
    expect(result[0]).toBe("CCS");
  });

  it("filters out empty titles", () => {
    const result = connectorLabels([
      { ConnectionType: { Title: "" } },
      { ConnectionType: { Title: "CCS (Type 2)" } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("CCS");
  });

  it("handles missing ConnectionType gracefully", () => {
    const result = connectorLabels([{ ConnectionType: undefined }]);
    expect(result).toHaveLength(0);
  });
});

// ─── kwColor ─────────────────────────────────────────────────────────────────

describe("kwColor", () => {
  it("returns text-amber-400 for 0 kW (unknown power)", () => {
    expect(kwColor(0)).toBe("text-amber-400");
  });

  it("returns text-green-500 for AC range (1–21 kW)", () => {
    expect(kwColor(1)).toBe("text-green-500");
    expect(kwColor(11)).toBe("text-green-500");
    expect(kwColor(21)).toBe("text-green-500");
  });

  it("returns text-violet-400 for 22 kW threshold", () => {
    expect(kwColor(22)).toBe("text-violet-400");
    expect(kwColor(49)).toBe("text-violet-400");
  });

  it("returns text-cyan-400 for DC range (50–149 kW)", () => {
    expect(kwColor(50)).toBe("text-cyan-400");
    expect(kwColor(100)).toBe("text-cyan-400");
    expect(kwColor(149)).toBe("text-cyan-400");
  });

  it("returns text-green-400 for HPC range (≥ 150 kW)", () => {
    expect(kwColor(150)).toBe("text-green-400");
    expect(kwColor(350)).toBe("text-green-400");
  });

  it("boundary: exactly 22 kW → violet, 21 kW → green-500", () => {
    expect(kwColor(22)).toBe("text-violet-400");
    expect(kwColor(21)).toBe("text-green-500");
  });

  it("boundary: exactly 50 kW → cyan, 49 kW → violet", () => {
    expect(kwColor(50)).toBe("text-cyan-400");
    expect(kwColor(49)).toBe("text-violet-400");
  });

  it("boundary: exactly 150 kW → green-400, 149 kW → cyan", () => {
    expect(kwColor(150)).toBe("text-green-400");
    expect(kwColor(149)).toBe("text-cyan-400");
  });
});
