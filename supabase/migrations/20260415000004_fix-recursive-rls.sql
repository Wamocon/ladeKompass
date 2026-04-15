-- Migration: Fix infinite recursion in profiles RLS policies
-- Recursion occurs when a policy on "profiles" queries "profiles" in a subquery
-- (e.g. checking if the user is admin by reading their role from profiles).
-- Fix: drop ALL existing policies on profiles, recreate them using only
-- auth.uid() = id (no self-referential subqueries).

-- ─── Drop all known problematic policies ─────────────────────────────────────
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'ladekompass-dev' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "ladekompass-dev".profiles', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- ─── Recreate clean, non-recursive policies ───────────────────────────────────

-- SELECT: user can only read their own row (no subquery = no recursion)
CREATE POLICY "profiles_select_own"
  ON "ladekompass-dev".profiles
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: user can only insert their own row
CREATE POLICY "profiles_insert_own"
  ON "ladekompass-dev".profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: user can only update their own row
CREATE POLICY "profiles_update_own"
  ON "ladekompass-dev".profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: user can only delete their own row
CREATE POLICY "profiles_delete_own"
  ON "ladekompass-dev".profiles
  FOR DELETE
  USING (auth.uid() = id);
