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

const FREE_PATTERNS = /kostenlos|free|gratis|0[\s,.]00\s*€/i;
const KWH_PATTERN   = /(\d+[.,]\d+)\s*(?:€|EUR|CHF|GBP)?\s*\/\s*kWh/i;
const KWH_PATTERN2  = /(?:€|EUR|CHF|GBP)\s*(\d+[.,]\d+)\s*\/\s*kWh/i;
const MIN_PATTERN   = /(\d+[.,]\d+)\s*(?:€|EUR|CHF|GBP)?\s*\/\s*min/i;
const SESSION_PATTERN = /(\d+[.,]\d+)\s*(?:€|EUR|CHF|GBP)?\s*(?:\/?\s*(?:session|sitzung|start|verbindung|aktivierung))/i;
const SESSION_FLAT    = /(?:session|sitzung|start|verbindung)[^\d]*(\d+[.,]\d+)/i;

function parseNum(s: string): number {
  return parseFloat(s.replace(",", "."));
}

export function parseUsageCost(raw: string | undefined | null): PriceData | null {
  if (!raw?.trim()) return null;

  if (FREE_PATTERNS.test(raw)) {
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
  const kwh1 = raw.match(KWH_PATTERN);
  const kwh2 = raw.match(KWH_PATTERN2);
  const kwhMatch = kwh1 ?? kwh2;
  if (kwhMatch) {
    lines.push({ label: "Energie", amount: parseNum(kwhMatch[1]), unit: "€/kWh" });
  }

  // Per-minute price
  const minMatch = raw.match(MIN_PATTERN);
  if (minMatch) {
    lines.push({ label: "Standzeit", amount: parseNum(minMatch[1]), unit: "€/min" });
  }

  // Session fee
  const sessMatch = raw.match(SESSION_PATTERN) ?? raw.match(SESSION_FLAT);
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

/**
 * Calls Chargeprice.app v2 API for a station.
 * Requires CHARGEPRICE_API_KEY env var.
 * Station is identified by its OCM UUID.
 */
export async function fetchChargepriceData(
  ocmUUID: string,
  _lat: number,
  _lng: number,
): Promise<PriceData | null> {
  const key = process.env.CHARGEPRICE_API_KEY;
  if (!key) return null;

  try {
    // Chargeprice uses JSON:API format
    const body = {
      data: {
        type: "price_request",
        attributes: {
          data_adapter_uids: [`ocm_${ocmUUID}`],
          max_monthly_fees: 0,
          energy: 40,
          duration: 60,
          battery_range: [0.1, 0.8],
          start_charge_speed: 100,
          end_charge_speed: 80,
        },
      },
    };

    const res = await fetch("https://api.chargeprice.app/v1/prices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 900 }, // cache 15 min
    });

    if (!res.ok) return null;
    const json = await res.json();

    const tariffs: ChargepriceResult[] = (json?.data ?? []).slice(0, 5).map(
      (d: { attributes: { tariff_name?: string; provider?: string; total_monthly_fee?: number; price?: { per_kwh?: number; per_minute?: number; session_fee?: number }; currency?: string } }) => ({
        tariff_name: d.attributes?.tariff_name ?? "",
        provider: d.attributes?.provider ?? "",
        total_monthly_fee: d.attributes?.total_monthly_fee ?? null,
        price: {
          per_kwh: d.attributes?.price?.per_kwh ?? null,
          per_minute: d.attributes?.price?.per_minute ?? null,
          session_fee: d.attributes?.price?.session_fee ?? null,
        },
        currency: d.attributes?.currency ?? "EUR",
      }),
    );

    if (tariffs.length === 0) return null;

    // Take cheapest tariff as headline
    const cheapest = tariffs.reduce((a, b) =>
      (a.price.per_kwh ?? 99) < (b.price.per_kwh ?? 99) ? a : b,
    );

    const lines: PriceLine[] = [];
    if (cheapest.price.per_kwh !== null)
      lines.push({ label: "Energie", amount: cheapest.price.per_kwh, unit: `${cheapest.currency}/kWh` });
    if (cheapest.price.per_minute !== null)
      lines.push({ label: "Standzeit", amount: cheapest.price.per_minute, unit: `${cheapest.currency}/min` });
    if (cheapest.price.session_fee !== null)
      lines.push({ label: "Sitzungsgebühr", amount: cheapest.price.session_fee, unit: cheapest.currency });

    return {
      lines,
      source: "chargeprice",
      isFree: cheapest.price.per_kwh === 0 && cheapest.price.session_fee === 0,
      currency: cheapest.currency,
      chargepriceUrl: `https://www.chargeprice.app/?station=${ocmUUID}&source=ocm`,
      note: `Günstigster Tarif: ${cheapest.provider} ${cheapest.tariff_name}`,
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
): Promise<PriceData> {
  // 1. Try Chargeprice.app API
  const cp = await fetchChargepriceData(ocmUUID, lat, lng);
  if (cp) {
    cp.operatorUrl = getOperatorUrl(operatorTitle);
    cp.chargepriceUrl = cp.chargepriceUrl ?? `https://www.chargeprice.app/?q=${encodeURIComponent(operatorTitle ?? "")}`;
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
