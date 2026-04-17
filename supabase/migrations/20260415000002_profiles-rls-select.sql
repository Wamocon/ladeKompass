-- Migration: Add missing RLS SELECT policy on profiles
-- Without this policy, authenticated users cannot read their own profile row.
-- This caused plan/role to always appear as the fallback ("free"/"driver") in the UI.

-- ─── 1. Enable RLS (idempotent) ──────────────────────────────────────────────
ALTER TABLE "ladekompass-dev".profiles ENABLE ROW LEVEL SECURITY;

-- ─── 2. SELECT: users can read their own row ─────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'ladekompass-dev'
      AND tablename  = 'profiles'
      AND policyname = 'Users can read their own profile'
  ) THEN
    CREATE POLICY "Users can read their own profile"
      ON "ladekompass-dev".profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- ─── 3. INSERT: users can insert their own row (needed for trigger/signup) ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'ladekompass-dev'
      AND tablename  = 'profiles'
      AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON "ladekompass-dev".profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
