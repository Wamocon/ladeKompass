import { type NextRequest, NextResponse } from "next/server";

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

  const lat = searchParams.get("lat") ?? "51.1657";
  const lng = searchParams.get("lng") ?? "10.4515";
  const distance = searchParams.get("distance") ?? "10";
  const maxResults = searchParams.get("maxResults") ?? "100";
  const powerLevel = searchParams.get("powerLevel"); // ac | dc | hpc
  const connectorType = searchParams.get("connectorType"); // type2 | ccs | chademo | tesla_ccs

  const OCM_BASE = "https://api.openchargemap.io/v3/poi/";
  const params = new URLSearchParams({
    output: "json",
    latitude: lat,
    longitude: lng,
    distance,
    distanceunit: "KM",
    maxresults: maxResults,
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
      },
    });

    if (!res.ok) {
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
