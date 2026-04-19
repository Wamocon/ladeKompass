import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/trips  — list the current user's trips
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("trips")
      .select("id, started_at, ended_at, from_label, to_label, distance_m, duration_s, charging_stops, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/trips  — save a completed trip
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body: {
      from_label?: string; to_label?: string;
      from_lat?: number; from_lng?: number;
      to_lat?: number; to_lng?: number;
      distance_m?: number; duration_s?: number;
      charging_stops?: unknown[]; route_geometry?: unknown;
      started_at?: string; ended_at?: string;
    } = await req.json();

    const { data, error } = await supabase.from("trips").insert({
      user_id: user.id,
      from_label: body.from_label?.slice(0, 300),
      to_label: body.to_label?.slice(0, 300),
      from_lat: body.from_lat,
      from_lng: body.from_lng,
      to_lat: body.to_lat,
      to_lng: body.to_lng,
      distance_m: body.distance_m,
      duration_s: body.duration_s,
      charging_stops: body.charging_stops ?? [],
      route_geometry: body.route_geometry ?? null,
      started_at: body.started_at ?? new Date().toISOString(),
      ended_at: body.ended_at ?? new Date().toISOString(),
    }).select("id").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data?.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/trips?id=<uuid>  — delete a trip
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
