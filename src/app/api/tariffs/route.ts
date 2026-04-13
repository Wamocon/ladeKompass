import { type NextRequest, NextResponse } from "next/server";

interface ChargepriceResult {
  id: string;
  name: string;
  url?: string;
  price?: number;
  pricePerKwh?: number;
  pricePerMinute?: number;
  baseFee?: number;
  blockingFee?: number;
  currency: string;
  isGreenEnergy?: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const stationId = searchParams.get("stationId");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const powerKw = searchParams.get("powerKw");

  if (!stationId && (!lat || !lng)) {
    return NextResponse.json(
      { error: "stationId or lat/lng required" },
      { status: 400 },
    );
  }

  const CHARGEPRICE_BASE = "https://api.chargeprice.app/v1/prices";
  const params = new URLSearchParams();
  if (stationId) params.set("station_id", stationId);
  if (lat) params.set("latitude", lat);
  if (lng) params.set("longitude", lng);
  if (powerKw) params.set("charge_point_power", powerKw);
  params.set("currency", "EUR");

  const apiKey = process.env.CHARGEPRICE_API_KEY;

  try {
    const res = await fetch(`${CHARGEPRICE_BASE}?${params.toString()}`, {
      next: { revalidate: 600 }, // cache 10 minutes
      headers: {
        "User-Agent": "LadeKompass/1.0",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
    });

    if (!res.ok) {
      // Chargeprice might 404 for unknown stations – return empty gracefully
      if (res.status === 404 || res.status === 422) {
        return NextResponse.json({ data: [] });
      }
      return NextResponse.json(
        { error: "Chargeprice API error", status: res.status },
        { status: 502 },
      );
    }

    const raw = await res.json();

    // Normalize response
    const prices: ChargepriceResult[] = (raw.data ?? []).map(
      (item: Record<string, unknown>) => ({
        id: String(item.id ?? ""),
        name: String((item.attributes as Record<string, unknown>)?.tariff_name ?? (item.attributes as Record<string, unknown>)?.name ?? ""),
        pricePerKwh: Number((item.attributes as Record<string, unknown>)?.total_monthly_fee ?? 0),
        price: Number((item.attributes as Record<string, unknown>)?.price ?? 0),
        currency: "EUR",
      }),
    );

    return NextResponse.json({ data: prices });
  } catch (err) {
    console.error("Chargeprice API error:", err);
    return NextResponse.json({ data: [] });
  }
}
