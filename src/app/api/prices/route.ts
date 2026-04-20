import { type NextRequest, NextResponse } from "next/server";
import { getPriceData } from "@/lib/price-service";

/**
 * GET /api/prices?stationId=<UUID>&usageCost=<text>&operator=<name>&lat=<n>&lng=<n>
 *
 * Returns structured price data for an EV charging station.
 * Priority: Chargeprice.app API → OCM UsageCost parsing → operator fallback.
 *
 * To enable live prices from Chargeprice.app, set CHARGEPRICE_API_KEY in .env.local
 * (free API key at https://www.chargeprice.app — contact form for developers)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const stationId  = searchParams.get("stationId");
  const usageCost  = searchParams.get("usageCost") ?? undefined;
  const operator   = searchParams.get("operator") ?? undefined;
  const connections = searchParams.get("connections") ?? undefined;
  const latStr     = searchParams.get("lat");
  const lngStr     = searchParams.get("lng");

  if (!stationId) {
    return NextResponse.json({ error: "stationId is required" }, { status: 400 });
  }

  const lat = latStr ? parseFloat(latStr) : 0;
  const lng = lngStr ? parseFloat(lngStr) : 0;

  const priceData = await getPriceData(stationId, usageCost, operator, lat, lng, connections);

  return NextResponse.json(priceData, {
    headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
  });
}
