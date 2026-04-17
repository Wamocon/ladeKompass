import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only allow these locale values to prevent open-redirect via path injection
const VALID_LOCALES = new Set(["de", "en"]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  // Use request.nextUrl.origin (framework-validated) instead of new URL(request.url)
  // to prevent Host-header injection attacks.
  const origin = request.nextUrl.origin;

  // Whitelist locale to prevent path-based open redirect
  const rawLocale = request.nextUrl.pathname.split("/")[1];
  const pathLocale = VALID_LOCALES.has(rawLocale) ? rawLocale : "de";

  // Validate next param: only allow same-origin internal paths
  const rawNext = searchParams.get("next");
  let next = `/${pathLocale}/dashboard`;
  if (rawNext) {
    try {
      // Parse to extract only pathname + search, never host/protocol
      const parsed = new URL(rawNext, origin);
      // Reject any redirect that would leave the current origin
      if (parsed.origin === origin && /^\/[^/]/.test(parsed.pathname)) {
        next = parsed.pathname + parsed.search;
      }
    } catch {
      // Malformed URL — fall back to default
    }
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Password recovery: redirect to update-password page
      if (type === "recovery") {
        return NextResponse.redirect(new URL(`/${pathLocale}/auth/update-password`, origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL(`/${pathLocale}/auth/login?error=auth_callback_failed`, origin));
}
