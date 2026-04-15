import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  // Detect locale from URL path prefix (e.g. /de/auth/callback → de)
  const pathLocale = request.nextUrl.pathname.split("/")[1] ?? "de";
  const next = searchParams.get("next") ?? `/${pathLocale}/dashboard`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Password recovery: redirect to update-password page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/${pathLocale}/auth/update-password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/${pathLocale}/auth/login?error=auth_callback_failed`);
}
