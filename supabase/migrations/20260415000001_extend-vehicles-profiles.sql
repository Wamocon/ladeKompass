-- Migration: Extend vehicles table + profiles with new fields
-- Run this in Supabase Dashboard → SQL Editor (schema: ladekompass-dev)

-- ─── 1. Extend vehicles table ────────────────────────────────────────────────
ALTER TABLE "ladekompass-dev".vehicles
  ADD COLUMN IF NOT EXISTS year             smallint,
  ADD COLUMN IF NOT EXISTS color            text,
  ADD COLUMN IF NOT EXISTS license_plate    text,
  ADD COLUMN IF NOT EXISTS vin              text,
  ADD COLUMN IF NOT EXISTS purchase_date    date,
  ADD COLUMN IF NOT EXISTS mileage_km       int,
  ADD COLUMN IF NOT EXISTS range_km         int,
  ADD COLUMN IF NOT EXISTS image_url        text,
  ADD COLUMN IF NOT EXISTS notes            text,
  ADD COLUMN IF NOT EXISTS insurance_expiry date,
  ADD COLUMN IF NOT EXISTS tuev_expiry      date,
  ADD COLUMN IF NOT EXISTS preferred_soc_min smallint DEFAULT 20,
  ADD COLUMN IF NOT EXISTS preferred_soc_max smallint DEFAULT 80,
  ADD COLUMN IF NOT EXISTS ac_charge_kw     numeric(6,1),
  ADD COLUMN IF NOT EXISTS efficiency_kwh_per_100km numeric(4,1);

-- ─── 2. Extend profiles table ─────────────────────────────────────────────────
ALTER TABLE "ladekompass-dev".profiles
  ADD COLUMN IF NOT EXISTS phone            text,
  ADD COLUMN IF NOT EXISTS bio              text,
  ADD COLUMN IF NOT EXISTS home_address     text,
  ADD COLUMN IF NOT EXISTS work_address     text,
  ADD COLUMN IF NOT EXISTS home_lat         numeric(10,7),
  ADD COLUMN IF NOT EXISTS home_lng         numeric(10,7),
  ADD COLUMN IF NOT EXISTS work_lat         numeric(10,7),
  ADD COLUMN IF NOT EXISTS work_lng         numeric(10,7),
  ADD COLUMN IF NOT EXISTS notify_station_status boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_news      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_promotions boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_connector text,
  ADD COLUMN IF NOT EXISTS min_charge_kw    int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charge_stop_soc  smallint DEFAULT 80,
  ADD COLUMN IF NOT EXISTS preferred_networks text[],
  ADD COLUMN IF NOT EXISTS avatar_url       text,
  ADD COLUMN IF NOT EXISTS locale_pref      text DEFAULT 'de',
  ADD COLUMN IF NOT EXISTS dark_mode        text DEFAULT 'system';

-- ─── 3. RLS: profiles — allow users to update own row ─────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'ladekompass-dev'
      AND tablename = 'profiles'
      AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON "ladekompass-dev".profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
