import { type NextRequest, NextResponse } from "next/server";
import { validateStationsQuery } from "@/lib/route-calc";

export interface OCMStation {
  ID: number;
  UUID: string;
  AddressInfo: {
    ID: number;
    Title: string;
    AddressLine1: string;
    Town: string;
    Postcode: string;
    Latitude: number;
    Longitude: number;
    AccessComments?: string;
  };
  StatusType?: {
    IsOperational: boolean;
    Title: string;
  };
  UsageCost?: string;
  Connections?: Array<{
    ConnectionTypeID: number;
    ConnectionType?: { Title: string };
    PowerKW?: number;
    CurrentTypeID?: number;
    Quantity?: number;
  }>;
  NumberOfPoints?: number;
  OperatorInfo?: {
    Title: string;
    WebsiteURL?: string;
  };
  OpeningTimes?: {
    IsOpen247: boolean;
    OpeningTimes?: Array<{ TimeRange: string; Weekdays: string }>;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const validation = validateStationsQuery(searchParams);
  if (validation.errors) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 },
    );
  }

  const { lat, lng, distance, maxResults, powerLevel, connectorType } = validation.data;
  const latStr = String(lat);
  const lngStr = String(lng);
  const distanceStr = String(distance);
  const maxResultsStr = String(maxResults);

  const OCM_BASE = "https://api.openchargemap.io/v3/poi/";
  const params = new URLSearchParams({
    output: "json",
    latitude: latStr,
    longitude: lngStr,
    distance: distanceStr,
    distanceunit: "KM",
    maxresults: maxResultsStr,
    compact: "false",
    verbose: "false",
    countrycode: "DE",
  });

  // Optional API key
  const apiKey = process.env.OCM_API_KEY;
  if (apiKey) params.set("key", apiKey);

  // Power level filter → minimum kW
  if (powerLevel === "dc") params.set("minpowerkw", "23");
  if (powerLevel === "hpc") params.set("minpowerkw", "151");

  // Connector type filter (OCM connection type IDs)
  const CONNECTOR_IDS: Record<string, string> = {
    type2: "25",
    ccs: "33",
    chademo: "2",
    tesla_ccs: "1036",
  };
  if (connectorType && CONNECTOR_IDS[connectorType]) {
    params.set("connectiontypeid", CONNECTOR_IDS[connectorType]);
  }

  try {
    const res = await fetch(`${OCM_BASE}?${params.toString()}`, {
      next: { revalidate: 300 }, // cache 5 minutes
      headers: {
        "User-Agent": "LadeKompass/1.0 (info@wamocon.com)",
        "Accept": "application/json",
      },
    });

    if (res.status === 429) {
      return NextResponse.json(
        { error: "Rate limit reached. Please add an OCM_API_KEY to .env.local for higher limits.", code: "RATE_LIMITED" },
        { status: 429 },
      );
    }

    if (res.status === 403) {
      return NextResponse.json(
        { error: "OCM API key required or invalid. Please set OCM_API_KEY in .env.local (free at openchargemap.org/site/develop/api).", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    if (!res.ok) {
      console.error(`OCM API error: HTTP ${res.status} for URL: ${OCM_BASE}?${params.toString()}`);
      return NextResponse.json(
        { error: "OCM API request failed", status: res.status },
        { status: 502 },
      );
    }

    const data: OCMStation[] = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("OCM API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
