-- Migration: Subscription management + map preferences persistence
-- Run in Supabase Dashboard → SQL Editor
-- Applies to all 3 schemas: ladekompass-dev, ladekompass-test, ladekompass-prod

-- ─── ladekompass-dev ─────────────────────────────────────────────────────────
ALTER TABLE "ladekompass-dev".profiles
  ADD COLUMN IF NOT EXISTS map_prefs       JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_trial        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_ends_at   TIMESTAMPTZ;

UPDATE "ladekompass-dev".profiles
  SET plan_started_at = created_at
  WHERE plan_started_at IS NULL;

-- ─── ladekompass-test ────────────────────────────────────────────────────────
ALTER TABLE "ladekompass-test".profiles
  ADD COLUMN IF NOT EXISTS map_prefs       JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_trial        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_ends_at   TIMESTAMPTZ;

UPDATE "ladekompass-test".profiles
  SET plan_started_at = created_at
  WHERE plan_started_at IS NULL;

-- ─── ladekompass-prod ────────────────────────────────────────────────────────
ALTER TABLE "ladekompass-prod".profiles
  ADD COLUMN IF NOT EXISTS map_prefs       JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_trial        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_ends_at   TIMESTAMPTZ;

UPDATE "ladekompass-prod".profiles
  SET plan_started_at = created_at
  WHERE plan_started_at IS NULL;
