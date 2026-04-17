-- Migration: BNetzA Ladesäulenregister integration
-- Creates tables to store and track the bulk import from BNetzA XLSX
-- NOTE: All tables are created in the "ladekompass-dev" schema (matching SUPABASE_DB_SCHEMA env var)

-- Main station table from BNetzA data
CREATE TABLE IF NOT EXISTS "ladekompass-dev".bnetza_stations (
  id                   BIGSERIAL PRIMARY KEY,
  betreiber            TEXT,
  strasse              TEXT,
  hausnummer           TEXT,
  adresszusatz         TEXT,
  postleitzahl         TEXT,
  ort                  TEXT,
  bundesland           TEXT,
  kreis_kreisfreie_stadt TEXT,
  breitengrad          DOUBLE PRECISION NOT NULL,
  laengengrad          DOUBLE PRECISION NOT NULL,
  inbetriebnahmedatum  DATE,
  nennleistung_kw      DOUBLE PRECISION,
  -- Plugs (up to 4 charge points per station in BNetzA data)
  anschluss_1          TEXT,
  kw_1                 DOUBLE PRECISION,
  anschluss_2          TEXT,
  kw_2                 DOUBLE PRECISION,
  anschluss_3          TEXT,
  kw_3                 DOUBLE PRECISION,
  anschluss_4          TEXT,
  kw_4                 DOUBLE PRECISION,
  -- Internal tracking
  bnetza_id            TEXT UNIQUE,           -- composite key from address + coords
  last_synced_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spatial index for proximity queries
CREATE INDEX IF NOT EXISTS bnetza_stations_coords_idx
  ON "ladekompass-dev".bnetza_stations (breitengrad, laengengrad);

CREATE INDEX IF NOT EXISTS bnetza_stations_ort_idx
  ON "ladekompass-dev".bnetza_stations (ort);

CREATE INDEX IF NOT EXISTS bnetza_stations_plz_idx
  ON "ladekompass-dev".bnetza_stations (postleitzahl);

-- Sync log table to track import runs
CREATE TABLE IF NOT EXISTS "ladekompass-dev".bnetza_sync_log (
  id           BIGSERIAL PRIMARY KEY,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ,
  rows_fetched INTEGER,
  rows_upserted INTEGER,
  rows_failed  INTEGER DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'running',   -- running | success | error
  error_msg    TEXT
);

-- RLS: read-only for all authenticated users, no writes from client
ALTER TABLE "ladekompass-dev".bnetza_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ladekompass-dev".bnetza_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bnetza_stations_select"
  ON "ladekompass-dev".bnetza_stations FOR SELECT
  USING (true);

CREATE POLICY "bnetza_sync_log_select"
  ON "ladekompass-dev".bnetza_sync_log FOR SELECT
  USING (true);

-- Grant read access to the anon and authenticated roles
GRANT SELECT ON "ladekompass-dev".bnetza_stations TO anon, authenticated;
GRANT SELECT ON "ladekompass-dev".bnetza_sync_log TO anon, authenticated;
