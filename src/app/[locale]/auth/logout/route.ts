import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const locale = request.nextUrl.pathname.split("/")[1] ?? "de";
  return NextResponse.redirect(new URL(`/${locale}/map`, request.url));
}
