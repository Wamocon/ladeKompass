/**
 * EV Map Pin Icons
 *
 * Creates teardrop-shaped SVG map pins for charging stations,
 * inspired by standard EV station signage.
 *
 * Pin types:
 *   hpc     – High Power Charging (≥150 kW) · yellow lightning bolt
 *   dc      – DC Fast Charging (22–149 kW)  · charging station icon
 *   ac      – AC Charging (<22 kW)           · car with charging cable
 *   unknown – Unknown power / general station · "EV" text
 *   offline – Offline / defect station        · red pin with X
 */

export type PinType = "hpc" | "dc" | "ac" | "unknown" | "offline";

// ─── Colours ────────────────────────────────────────────────────────────────

const PIN_COLORS: Record<PinType, string> = {
  hpc:     "#15803d", // dark green
  dc:      "#16a34a", // green
  ac:      "#22c55e", // light green
  unknown: "#64748b", // slate gray
  offline: "#dc2626", // red
};

const PIN_SHADOW: Record<PinType, string> = {
  hpc:     "rgba(21,128,61,0.55)",
  dc:      "rgba(22,163,74,0.5)",
  ac:      "rgba(34,197,94,0.45)",
  unknown: "rgba(100,116,139,0.4)",
  offline: "rgba(220,38,38,0.55)",
};

// ─── Inner icon paths (36×46 viewBox, white circle r=12.5 at cx=18 cy=18) ──

/** Yellow lightning bolt – for HPC stations */
function lightningInner(): string {
  return `<polygon points="21,8 13.5,20 17.5,20 14.5,28 23.5,16 19.5,16" fill="#fbbf24"/>`;
}

/** Charging station silhouette – for DC stations */
function stationInner(color: string): string {
  return [
    `<rect x="13" y="8" width="10" height="14" rx="2" fill="${color}"/>`,
    `<rect x="15" y="10" width="6" height="4.5" rx="1" fill="white" opacity="0.25"/>`,
    `<polygon points="20,10 16.5,15.5 18.5,15.5 16,19 21.5,13.5 19.5,13.5" fill="white"/>`,
    `<rect x="12" y="22" width="12" height="2" rx="1" fill="${color}"/>`,
    `<line x1="23" y1="14.5" x2="26" y2="14.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`,
    `<rect x="25.5" y="12.5" width="2.5" height="4" rx="0.5" fill="${color}"/>`,
  ].join("");
}

/** Electric car with charging cable – for AC stations */
function carInner(color: string): string {
  return [
    // Car body
    `<rect x="7" y="18" width="17" height="7" rx="2" fill="${color}"/>`,
    // Roof cabin
    `<path d="M9.5,18 L12.5,13.5 L19.5,13.5 L22.5,18" fill="${color}"/>`,
    // Window
    `<rect x="12" y="14" width="8" height="3.5" rx="1" fill="white" opacity="0.35"/>`,
    // Wheels
    `<circle cx="11" cy="25.5" r="2.5" fill="#374151"/>`,
    `<circle cx="21" cy="25.5" r="2.5" fill="#374151"/>`,
    `<circle cx="11" cy="25.5" r="1" fill="${color}"/>`,
    `<circle cx="21" cy="25.5" r="1" fill="${color}"/>`,
    // Charging cable + plug
    `<path d="M24,19.5 Q29,19.5 29,22" stroke="${color}" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,
    `<rect x="28" y="21" width="3.5" height="4.5" rx="0.8" fill="#f59e0b"/>`,
    `<line x1="29" y1="25.5" x2="29" y2="27" stroke="#f59e0b" stroke-width="1.2" stroke-linecap="round"/>`,
    `<line x1="30.5" y1="25.5" x2="30.5" y2="27" stroke="#f59e0b" stroke-width="1.2" stroke-linecap="round"/>`,
  ].join("");
}

/** "EV" text icon – for unknown / general stations */
function evTextInner(color: string): string {
  return [
    `<circle cx="18" cy="18" r="9.5" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.3"/>`,
    `<text x="18" y="22.5" text-anchor="middle"`,
    ` font-family="Arial Black,Arial,sans-serif"`,
    ` font-weight="900" font-size="9.5" fill="${color}" letter-spacing="-0.5">EV</text>`,
  ].join("");
}

/** X mark – for offline stations */
function offlineInner(): string {
  return [
    `<line x1="13" y1="13" x2="23" y2="23" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>`,
    `<line x1="23" y1="13" x2="13" y2="23" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>`,
  ].join("");
}

// ─── Pin builder ─────────────────────────────────────────────────────────────

function makePinSvg(type: PinType, size = 36): string {
  const color    = PIN_COLORS[type];
  const shadow   = PIN_SHADOW[type];
  const height   = Math.round(size * 46 / 36);
  // Unique filter ID per type prevents DOM ID collisions when multiple SVGs
  // are embedded inline (e.g. Leaflet divIcon renders multiple pins in one DOM)
  const filterId = `lk-pin-shadow-${type}`;

  let inner: string;
  switch (type) {
    case "hpc":     inner = lightningInner();         break;
    case "dc":      inner = stationInner(color);      break;
    case "ac":      inner = carInner(color);          break;
    case "offline": inner = offlineInner();           break;
    default:        inner = evTextInner(color);       break;
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="${size}" height="${height}">`,
    `<defs>`,
    `<filter id="${filterId}" x="-40%" y="-20%" width="180%" height="160%">`,
    `<feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="${shadow}"/>`,
    `</filter>`,
    `</defs>`,
    // Teardrop pin body
    `<path d="M18 2C8.6 2 1 9.6 1 19C1 28.5 7.5 36 18 44C28.5 36 35 28.5 35 19C35 9.6 27.4 2 18 2Z"`,
    ` fill="${color}" filter="url(#${filterId})"/>`,
    // White inner circle
    `<circle cx="18" cy="18" r="12.5" fill="white"/>`,
    inner,
    `</svg>`,
  ].join("");
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Returns an HTML string suitable for Leaflet `L.divIcon({ html })` */
export function createEvPinHtml(type: PinType, size?: number): string {
  const s = size ?? (type === "hpc" ? 36 : type === "dc" ? 32 : 28);
  return makePinSvg(type, s);
}

/** Returns an SVG string for MapLibre GL `map.addImage()` via data URL */
export function getEvPinSvg(type: PinType): string {
  return makePinSvg(type, 36);
}

/** Returns a `data:image/svg+xml` URL for a given pin type */
export function getEvPinDataUrl(type: PinType): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getEvPinSvg(type))}`;
}

/**
 * Derives the pin type from charging power and operational status.
 * `isOperational === null` means the status is unknown.
 */
export function getStationPinType(
  powerKw: number,
  isOperational: boolean | null | undefined,
): PinType {
  if (isOperational === false) return "offline";
  if (powerKw >= 150) return "hpc";
  if (powerKw >= 22)  return "dc";
  if (powerKw > 0)    return "ac";
  return "unknown";
}

/** All pin type IDs — used for pre-loading images into MapLibre GL */
export const ALL_PIN_TYPES: PinType[] = ["hpc", "dc", "ac", "unknown", "offline"];

/** Human-readable label for each pin type */
export const PIN_LABELS: Record<PinType, string> = {
  hpc:     "HPC (≥150 kW)",
  dc:      "DC (22–149 kW)",
  ac:      "AC (<22 kW)",
  unknown: "Unbekannt",
  offline: "Offline",
};
