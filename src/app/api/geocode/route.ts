import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=de,at,ch&limit=5&addressdetails=0`;

  try {
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "de",
        // Required by Nominatim ToS: must identify the app
        "User-Agent": "LadeKompass/1.0 (https://ladekompass.de)",
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
