import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Whitelist to prevent path-based open redirect
const VALID_LOCALES = new Set(["de", "en"]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const rawLocale = request.nextUrl.pathname.split("/")[1];
  const locale = VALID_LOCALES.has(rawLocale) ? rawLocale : "de";
  // Use request.nextUrl.origin to prevent Host-header injection
  return NextResponse.redirect(new URL(`/${locale}/map`, request.nextUrl.origin));
}
