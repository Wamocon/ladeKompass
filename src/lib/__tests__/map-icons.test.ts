import { describe, it, expect } from "vitest";
import {
  ALL_PIN_TYPES,
  PIN_LABELS,
  createEvPinHtml,
  getEvPinDataUrl,
  getEvPinSvg,
  getStationPinType,
  type PinType,
} from "../map-icons";

// ─────────────────────────────────────────────────────────────────────────────
// ALL_PIN_TYPES
// ─────────────────────────────────────────────────────────────────────────────

describe("ALL_PIN_TYPES", () => {
  it("contains exactly 5 types", () => {
    expect(ALL_PIN_TYPES).toHaveLength(5);
  });

  it("contains hpc, dc, ac, unknown, offline", () => {
    expect(ALL_PIN_TYPES).toContain("hpc");
    expect(ALL_PIN_TYPES).toContain("dc");
    expect(ALL_PIN_TYPES).toContain("ac");
    expect(ALL_PIN_TYPES).toContain("unknown");
    expect(ALL_PIN_TYPES).toContain("offline");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PIN_LABELS
// ─────────────────────────────────────────────────────────────────────────────

describe("PIN_LABELS", () => {
  it("has a label for every pin type in ALL_PIN_TYPES", () => {
    for (const type of ALL_PIN_TYPES) {
      expect(PIN_LABELS[type]).toBeTruthy();
    }
  });

  it("hpc label mentions 150 kW", () => {
    expect(PIN_LABELS.hpc).toContain("150");
  });

  it("dc label mentions 22 kW", () => {
    expect(PIN_LABELS.dc).toContain("22");
  });

  it("ac label exists and is a non-empty string", () => {
    expect(typeof PIN_LABELS.ac).toBe("string");
    expect(PIN_LABELS.ac.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getStationPinType
// ─────────────────────────────────────────────────────────────────────────────

describe("getStationPinType", () => {
  // --- offline ---
  it("returns 'offline' when isOperational is false, any power", () => {
    expect(getStationPinType(0, false)).toBe("offline");
    expect(getStationPinType(150, false)).toBe("offline");
    expect(getStationPinType(350, false)).toBe("offline");
  });

  // --- hpc ---
  it("returns 'hpc' for power >= 150 kW and operational", () => {
    expect(getStationPinType(150, true)).toBe("hpc");
    expect(getStationPinType(350, true)).toBe("hpc");
    expect(getStationPinType(150, null)).toBe("hpc");
    expect(getStationPinType(150, undefined)).toBe("hpc");
  });

  it("returns 'hpc' at exactly 150 kW", () => {
    expect(getStationPinType(150, true)).toBe("hpc");
  });

  it("does NOT return 'hpc' at 149 kW", () => {
    expect(getStationPinType(149, true)).not.toBe("hpc");
  });

  // --- dc ---
  it("returns 'dc' for 22 kW <= power < 150 kW", () => {
    expect(getStationPinType(22, true)).toBe("dc");
    expect(getStationPinType(50, true)).toBe("dc");
    expect(getStationPinType(149, true)).toBe("dc");
    expect(getStationPinType(22, null)).toBe("dc");
  });

  it("returns 'dc' at exactly 22 kW", () => {
    expect(getStationPinType(22, true)).toBe("dc");
  });

  it("does NOT return 'dc' at 21 kW", () => {
    expect(getStationPinType(21, true)).not.toBe("dc");
  });

  // --- ac ---
  it("returns 'ac' for 0 < power < 22 kW", () => {
    expect(getStationPinType(1, true)).toBe("ac");
    expect(getStationPinType(11, true)).toBe("ac");
    expect(getStationPinType(21, true)).toBe("ac");
    expect(getStationPinType(3.7, null)).toBe("ac");
  });

  // --- unknown ---
  it("returns 'unknown' for power = 0 and operational", () => {
    expect(getStationPinType(0, true)).toBe("unknown");
    expect(getStationPinType(0, null)).toBe("unknown");
    expect(getStationPinType(0, undefined)).toBe("unknown");
  });

  // --- boundary: null / undefined status ---
  it("treats null isOperational as 'not offline'", () => {
    expect(getStationPinType(200, null)).toBe("hpc");
  });

  it("treats undefined isOperational as 'not offline'", () => {
    expect(getStationPinType(200, undefined)).toBe("hpc");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getEvPinSvg
// ─────────────────────────────────────────────────────────────────────────────

describe("getEvPinSvg", () => {
  it("returns a non-empty string for every pin type", () => {
    for (const type of ALL_PIN_TYPES) {
      const svg = getEvPinSvg(type);
      expect(typeof svg).toBe("string");
      expect(svg.length).toBeGreaterThan(0);
    }
  });

  it("returns valid SVG starting with <svg", () => {
    for (const type of ALL_PIN_TYPES) {
      expect(getEvPinSvg(type)).toMatch(/^<svg /);
    }
  });

  it("includes closing </svg> tag", () => {
    for (const type of ALL_PIN_TYPES) {
      expect(getEvPinSvg(type)).toContain("</svg>");
    }
  });

  it("includes unique filter ID per type (no lk-pin-shadow-X collision)", () => {
    const filterIds = ALL_PIN_TYPES.map((type) => {
      const match = getEvPinSvg(type).match(/id="([^"]+)"/);
      return match?.[1] ?? "";
    });
    // All filter IDs must be unique
    const unique = new Set(filterIds);
    expect(unique.size).toBe(ALL_PIN_TYPES.length);
  });

  it("uses filter ID matching lk-pin-shadow-<type> pattern", () => {
    for (const type of ALL_PIN_TYPES) {
      const svg = getEvPinSvg(type);
      expect(svg).toContain(`id="lk-pin-shadow-${type}"`);
    }
  });

  it("each SVG references its own filter (no cross-type filter ID references)", () => {
    for (const type of ALL_PIN_TYPES) {
      const svg = getEvPinSvg(type);
      const expectedRef = `url(#lk-pin-shadow-${type})`;
      expect(svg).toContain(expectedRef);
      // Must NOT reference other types' filters
      for (const other of ALL_PIN_TYPES) {
        if (other !== type) {
          expect(svg).not.toContain(`url(#lk-pin-shadow-${other})`);
        }
      }
    }
  });

  it("hpc SVG contains lightning bolt (polygon element)", () => {
    expect(getEvPinSvg("hpc")).toContain("<polygon");
  });

  it("offline SVG contains X lines", () => {
    const svg = getEvPinSvg("offline");
    // The offline icon has two crossing lines
    expect(svg.match(/<line/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("unknown SVG contains 'EV' text", () => {
    expect(getEvPinSvg("unknown")).toContain(">EV<");
  });

  it("SVG has correct viewBox 0 0 36 46", () => {
    for (const type of ALL_PIN_TYPES) {
      expect(getEvPinSvg(type)).toContain('viewBox="0 0 36 46"');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createEvPinHtml
// ─────────────────────────────────────────────────────────────────────────────

describe("createEvPinHtml", () => {
  it("returns a non-empty string for every pin type", () => {
    for (const type of ALL_PIN_TYPES) {
      expect(createEvPinHtml(type)).toBeTruthy();
    }
  });

  it("returns valid SVG markup", () => {
    for (const type of ALL_PIN_TYPES) {
      expect(createEvPinHtml(type)).toMatch(/^<svg /);
    }
  });

  it("uses default size hpc=36, dc=32, ac=28 when size omitted", () => {
    expect(createEvPinHtml("hpc")).toContain('width="36"');
    expect(createEvPinHtml("dc")).toContain('width="32"');
    expect(createEvPinHtml("ac")).toContain('width="28"');
  });

  it("uses custom size when provided", () => {
    const svg = createEvPinHtml("hpc", 48);
    expect(svg).toContain('width="48"');
  });

  it("height is proportional (46/36 ratio, rounded)", () => {
    // Default hpc size=36 → height = round(36 * 46/36) = 46
    expect(createEvPinHtml("hpc")).toContain('height="46"');
    // ac default size=28 → height = round(28 * 46/36) = 36
    expect(createEvPinHtml("ac")).toContain('height="36"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getEvPinDataUrl
// ─────────────────────────────────────────────────────────────────────────────

describe("getEvPinDataUrl", () => {
  it("returns a data: URL for every pin type", () => {
    for (const type of ALL_PIN_TYPES) {
      const url = getEvPinDataUrl(type);
      expect(url).toMatch(/^data:image\/svg\+xml/);
    }
  });

  it("URL contains charset=utf-8", () => {
    for (const type of ALL_PIN_TYPES) {
      expect(getEvPinDataUrl(type)).toContain("charset=utf-8");
    }
  });

  it("URL is URL-encoded (no raw < characters)", () => {
    for (const type of ALL_PIN_TYPES) {
      const url = getEvPinDataUrl(type);
      // After the data: prefix + charset, the SVG must be URL-encoded
      const encoded = url.split(",")[1] ?? "";
      expect(encoded).not.toContain("<svg ");
      expect(encoded).toContain("%3Csvg"); // '<' encoded as %3C or %3c
    }
  });

  it("decodes back to valid SVG", () => {
    for (const type of ALL_PIN_TYPES) {
      const url = getEvPinDataUrl(type);
      const encoded = url.split(",")[1] ?? "";
      const decoded = decodeURIComponent(encoded);
      expect(decoded).toMatch(/^<svg /);
    }
  });
});
