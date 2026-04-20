/**
 * Price Service — parses OCM UsageCost text + Chargeprice.app API integration.
 *
 * Sources (in priority order):
 *  1. Chargeprice.app API (if CHARGEPRICE_API_KEY is set)
 *  2. OCM UsageCost free-text field (parsed)
 *  3. Operator website fallback link
 */

export interface PriceLine {
  label: string;          // "AC", "DC", "HPC", "pro Minute", "Sitzungsgebühr"
  amount: number;
  unit: string;           // "€/kWh", "€/min", "€"
}

export interface PriceData {
  lines: PriceLine[];
  rawText?: string;
  source: "chargeprice" | "ocm_parsed" | "operator" | "unknown";
  isFree: boolean;
  currency: string;       // "EUR"
  chargepriceUrl?: string;
  operatorUrl?: string;
  note?: string;
}

// ─── OCM UsageCost parser ─────────────────────────────────────────────────────
// ReDoS-safe regexes: the two adjacent whitespace quantifiers that surrounded an
// optional currency group were ambiguous (polynomial backtracking). Each pattern
// now uses mutually-exclusive branches so the engine has at most one path to try.
// [ \t]{0,N}(currency)[ \t]{0,N}  →  (currency-branch | space-only-branch)

const FREE_PATTERNS = /kostenlos|free|gratis|0[,. ]00[ \t]{0,10}€/i;

// "0.39 €/kWh" or "0.39/kWh" — currency+spaces XOR spaces-only, never both paths
const KWH_PATTERN = /(\d+[.,]\d+)(?:[ \t]{0,10}(?:€|EUR|CHF|GBP)[ \t]{0,10}|[ \t]{0,20})\/[ \t]{0,5}kWh/i;
const KWH_PATTERN2 = /(?:€|EUR|CHF|GBP)[ \t]{0,10}(\d+[.,]\d+)[ \t]{0,10}\/[ \t]{0,5}kWh/i;

// "0.39 €/min" or "0.39/min"
const MIN_PATTERN = /(\d+[.,]\d+)(?:[ \t]{0,10}(?:€|EUR|CHF|GBP)[ \t]{0,10}|[ \t]{0,20})\/[ \t]{0,5}min/i;

// "0.39 €/session" or "0.39/session"
const SESSION_PATTERN = /(\d+[.,]\d+)(?:[ \t]{0,10}(?:€|EUR|CHF|GBP)[ \t]{0,5}|[ \t]{0,15})(?:\/[ \t]{0,5})?(?:session|sitzung|start|verbindung|aktivierung)/i;

// "session: 0.39" — separator must NOT contain '.' or ',' (they overlap with price [.,])
const SESSION_FLAT = /(?:session|sitzung|start|verbindung)[ \t:]{0,15}(\d+[.,]\d+)/i;

function parseNum(s: string): number {
  return parseFloat(s.replace(",", "."));
}

export function parseUsageCost(raw: string | undefined | null): PriceData | null {
  if (!raw?.trim()) return null;

  // Cap input length to break the taint chain: even with safe regexes, applying
  // them to an unbounded user-controlled string is flagged by static analysis.
  // OCM UsageCost is a short display field; 500 chars is far more than enough.
  const input = raw.slice(0, 500);

  if (FREE_PATTERNS.test(input)) {
    return {
      lines: [],
      rawText: raw,
      source: "ocm_parsed",
      isFree: true,
      currency: "EUR",
      note: "Kostenlos",
    };
  }

  const lines: PriceLine[] = [];

  // kWh price
  const kwh1 = input.match(KWH_PATTERN);
  const kwh2 = input.match(KWH_PATTERN2);
  const kwhMatch = kwh1 ?? kwh2;
  if (kwhMatch) {
    lines.push({ label: "Energie", amount: parseNum(kwhMatch[1]), unit: "€/kWh" });
  }

  // Per-minute price
  const minMatch = input.match(MIN_PATTERN);
  if (minMatch) {
    lines.push({ label: "Standzeit", amount: parseNum(minMatch[1]), unit: "€/min" });
  }

  // Session fee
  const sessMatch = input.match(SESSION_PATTERN) ?? input.match(SESSION_FLAT);
  if (sessMatch) {
    lines.push({ label: "Verbindungsgebühr", amount: parseNum(sessMatch[1]), unit: "€" });
  }

  if (lines.length === 0) {
    // Can't parse the structure but there is text — return raw
    return {
      lines: [],
      rawText: raw,
      source: "ocm_parsed",
      isFree: false,
      currency: "EUR",
    };
  }

  return {
    lines,
    rawText: raw,
    source: "ocm_parsed",
    isFree: false,
    currency: "EUR",
  };
}

// ─── Chargeprice.app API ──────────────────────────────────────────────────────

export interface ChargepriceResult {
  tariff_name: string;
  provider: string;
  total_monthly_fee: number | null;
  price: {
    per_kwh: number | null;
    per_minute: number | null;
    session_fee: number | null;
  };
  currency: string;
}

// OCM ConnectionTypeID → Chargeprice plug name mapping
// Format for open_charge_map adapter: "connectionTypeId,currentTypeId"
// currentTypeId: 10=AC, 20=DC, 30=DC (fast)
function ocmConnectionToPlug(connectionTypeId: number, powerKw: number): string {
  // Use the raw OCM IDs as comma-separated — Chargeprice expects "connTypeId,currentTypeId"
  // For simplicity pass just the connectionTypeId as required by OCM adapter
  // powerKw helps infer AC vs DC current type
  const currentTypeId = powerKw >= 22 ? "30" : "10";
  return `${connectionTypeId},${currentTypeId}`;
}

/**
 * Calls Chargeprice.app v1/charge_prices API for a station.
 * Requires CHARGEPRICE_API_KEY env var.
 * connections format: "connectionTypeId:powerKw;connectionTypeId:powerKw;..."
 */
export async function fetchChargepriceData(
  ocmUUID: string,
  lat: number,
  lng: number,
  operatorTitle?: string,
  connections?: string,
): Promise<PriceData | null> {
  const key = process.env.CHARGEPRICE_API_KEY;
  if (!key) return null;

  // Build charge_points from connections string
  type ChargePoint = { power: number; plug: string };
  let chargePoints: ChargePoint[] = [];
  if (connections) {
    chargePoints = connections
      .split(";")
      .map((pair) => {
        const [typeIdStr, kwStr] = pair.split(":");
        const typeId = parseInt(typeIdStr, 10);
        const kw = parseFloat(kwStr);
        if (!typeId || !kw || !isFinite(kw)) return null;
        return { power: kw, plug: ocmConnectionToPlug(typeId, kw) };
      })
      .filter((cp): cp is ChargePoint => cp !== null)
      .slice(0, 6); // max 6 charge points
  }

  // Fallback: generic charge point if none provided
  if (chargePoints.length === 0) {
    chargePoints = [{ power: 22, plug: "25,10" }]; // Type 2 AC as fallback
  }

  const body = {
    data: {
      type: "charge_price_request",
      attributes: {
        data_adapter: "open_charge_map",
        station: {
          longitude: lng,
          latitude: lat,
          country: "DE",
          network: operatorTitle ?? "",
          charge_points: chargePoints,
        },
        options: {
          energy: 30,
          duration: 45,
          max_monthly_fees: 0,
        },
      },
    },
  };

  try {
    const res = await fetch("https://api.chargeprice.app/v1/charge_prices", {
      method: "POST",
      headers: {
        "Api-Key": key,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Language": "de",
      },
      body: JSON.stringify(body),
      next: { revalidate: 900 }, // cache 15 min
    });

    if (!res.ok) return null;
    const json = await res.json();

    type RawTariff = {
      attributes: {
        provider?: string;
        tariff_name?: string;
        total_monthly_fee?: number;
        currency?: string;
        charge_point_prices?: Array<{
          power?: number;
          plug?: string;
          price?: number | null;
          price_distribution?: { kwh?: number; minute?: number; session?: number };
        }>;
      };
    };

    const tariffs = ((json?.data ?? []) as RawTariff[]).slice(0, 10);
    if (tariffs.length === 0) return null;

    // Find cheapest by total price across all charge points
    let cheapestProvider = "";
    let cheapestTariff = "";
    let cheapestKwh: number | null = null;
    let cheapestMin: number | null = null;
    let cheapestSession: number | null = null;
    let cheapestCurrency = "EUR";
    let cheapestTotal = Infinity;

    for (const t of tariffs) {
      const attr = t.attributes;
      const cpp = attr.charge_point_prices ?? [];
      for (const cp of cpp) {
        const total = cp.price ?? Infinity;
        if (total < cheapestTotal) {
          cheapestTotal = total;
          cheapestProvider = attr.provider ?? "";
          cheapestTariff = attr.tariff_name ?? "";
          cheapestCurrency = attr.currency ?? "EUR";
          // Estimate per-kwh from price distribution
          const dist = cp.price_distribution ?? {};
          cheapestKwh = dist.kwh != null ? +(total * dist.kwh / 30).toFixed(4) : null;
          cheapestMin = dist.minute != null ? +(total * dist.minute / 45).toFixed(4) : null;
          cheapestSession = dist.session != null ? +(total * dist.session).toFixed(2) : null;
        }
      }
    }

    if (cheapestTotal === Infinity) return null;

    const lines: PriceLine[] = [];
    if (cheapestKwh !== null && cheapestKwh > 0)
      lines.push({ label: "Energie", amount: cheapestKwh, unit: `${cheapestCurrency}/kWh` });
    if (cheapestMin !== null && cheapestMin > 0)
      lines.push({ label: "Standzeit", amount: cheapestMin, unit: `${cheapestCurrency}/min` });
    if (cheapestSession !== null && cheapestSession > 0)
      lines.push({ label: "Sitzungsgebühr", amount: cheapestSession, unit: cheapestCurrency });

    // If no line-items but we have a total, show total per session
    if (lines.length === 0) {
      lines.push({ label: "Ladekosten (ca.)", amount: +cheapestTotal.toFixed(2), unit: cheapestCurrency });
    }

    return {
      lines,
      source: "chargeprice",
      isFree: cheapestTotal === 0,
      currency: cheapestCurrency,
      chargepriceUrl: `https://www.chargeprice.app/?station=${ocmUUID}&source=ocm`,
      note: `Günstigster Tarif: ${cheapestProvider}${cheapestTariff ? ` – ${cheapestTariff}` : ""}`,
    };
  } catch {
    return null;
  }
}

// ─── Operator URL lookup ──────────────────────────────────────────────────────

const OPERATOR_URLS: Record<string, string> = {
  tesla: "https://www.tesla.com/de_de/support/supercharger#supercharger",
  ionity: "https://ionity.eu/de/tarife.html",
  "enBW": "https://www.enbw.com/elektromobilitaet/produkte-und-tarife.html",
  fastned: "https://fastned.nl/de/tarife",
  aral: "https://www.aral.de/de/e-mobilitaet/aral-pulse.html",
  allego: "https://allego.eu/fahrer/laden/ladegebuhren",
  mer: "https://mer.eco/de/preise",
  be: "https://be-mobility.com/tarife",
  "vattenfall energi": "https://vattenfall.se/elbil",
};

export function getOperatorUrl(operatorTitle?: string): string | undefined {
  if (!operatorTitle) return undefined;
  const lower = operatorTitle.toLowerCase();
  for (const [key, url] of Object.entries(OPERATOR_URLS)) {
    if (lower.includes(key.toLowerCase())) return url;
  }
  return undefined;
}

// ─── Main entry point (server-side) ──────────────────────────────────────────

export async function getPriceData(
  ocmUUID: string,
  usageCost: string | undefined,
  operatorTitle: string | undefined,
  lat: number,
  lng: number,
  connections?: string,
): Promise<PriceData> {
  // 1. Try Chargeprice.app API
  const cp = await fetchChargepriceData(ocmUUID, lat, lng, operatorTitle, connections);
  if (cp) {
    cp.operatorUrl = getOperatorUrl(operatorTitle);
    return cp;
  }

  // 2. Parse OCM UsageCost
  const parsed = parseUsageCost(usageCost);
  if (parsed) {
    parsed.operatorUrl = getOperatorUrl(operatorTitle);
    parsed.chargepriceUrl = `https://www.chargeprice.app/?station=${ocmUUID}&source=ocm`;
    return parsed;
  }

  // 3. Fallback: no price data
  return {
    lines: [],
    source: "unknown",
    isFree: false,
    currency: "EUR",
    operatorUrl: getOperatorUrl(operatorTitle),
    chargepriceUrl: `https://www.chargeprice.app/?station=${ocmUUID}&source=ocm`,
  };
}
