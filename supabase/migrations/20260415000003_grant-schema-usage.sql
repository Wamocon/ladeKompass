-- Migration: Grant schema usage + table permissions on custom schema
-- Without these grants, RLS policies exist but authenticated/anon roles
-- cannot access the schema at all, so all queries return empty results.

-- ─── 1. Grant USAGE on the custom schema to all API roles ────────────────────
GRANT USAGE ON SCHEMA "ladekompass-dev" TO authenticated;
GRANT USAGE ON SCHEMA "ladekompass-dev" TO anon;
GRANT ALL   ON SCHEMA "ladekompass-dev" TO service_role;

-- ─── 2. Grant table-level permissions ────────────────────────────────────────

-- authenticated: full CRUD on all tables
GRANT ALL ON ALL TABLES IN SCHEMA "ladekompass-dev" TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "ladekompass-dev" GRANT ALL ON TABLES TO authenticated;

-- anon: read-only (for public data like station lookups)
GRANT SELECT ON ALL TABLES IN SCHEMA "ladekompass-dev" TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA "ladekompass-dev" GRANT SELECT ON TABLES TO anon;

-- service_role: full access (admin/server-side operations)
GRANT ALL ON ALL TABLES IN SCHEMA "ladekompass-dev" TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "ladekompass-dev" GRANT ALL ON TABLES TO service_role;

-- ─── 3. Grant sequence permissions (needed for serial/identity columns) ──────
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "ladekompass-dev" TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "ladekompass-dev" TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "ladekompass-dev" TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "ladekompass-dev" GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "ladekompass-dev" GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA "ladekompass-dev" GRANT ALL ON SEQUENCES TO service_role;
