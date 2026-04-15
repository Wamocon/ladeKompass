import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component – safe to ignore
          }
        },
      },
    },
  );
}

/**
 * Service client using @supabase/supabase-js directly — NOT @supabase/ssr.
 * This ensures NO user JWT from cookies is attached, so service_role key
 * truly bypasses RLS. Use for all DB reads/writes in Server Components and
 * Server Actions where RLS would otherwise block access.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev" },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
