import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface ReportPayload {
  stationId: string;
  stationName?: string;
  lat?: number;
  lng?: number;
  reportType: "available" | "occupied" | "defect" | "price" | "other";
  description?: string;
  priceKwh?: number;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ReportPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { stationId, stationName, lat, lng, reportType, description, priceKwh } = body;

  if (!stationId || !reportType) {
    return NextResponse.json(
      { error: "stationId and reportType are required" },
      { status: 400 },
    );
  }

  const { data: report, error: reportError } = await supabase
    .from("station_reports")
    .insert({
      user_id: user.id,
      station_id: stationId,
      station_name: stationName,
      lat,
      lng,
      report_type: reportType,
      description,
      price_kwh: priceKwh,
    })
    .select("id")
    .single();

  if (reportError) {
    console.error("[reports] insert station_reports error:", reportError.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  await supabase.from("news_feed").insert({
    type: "community_report",
    user_id: user.id,
    payload: {
      reportId: report.id,
      stationId,
      stationName,
      lat,
      lng,
      reportType,
      description,
      priceKwh,
    },
  });

  return NextResponse.json({ success: true, reportId: report.id }, { status: 201 });
}
