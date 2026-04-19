-- ============================================================
-- Trip Archive: store completed navigation trips
-- ============================================================

CREATE TABLE IF NOT EXISTS trips (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  from_label      TEXT,
  to_label        TEXT,
  from_lat        FLOAT8,
  from_lng        FLOAT8,
  to_lat          FLOAT8,
  to_lng          FLOAT8,
  distance_m      FLOAT8,
  duration_s      FLOAT8,
  charging_stops  JSONB       DEFAULT '[]'::jsonb,
  route_geometry  JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast per-user listing
CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips (user_id, created_at DESC);

-- RLS: users can only see and manage their own trips
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY trips_select ON trips
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY trips_insert ON trips
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY trips_delete ON trips
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- Station comments (community live feed)
-- ============================================================

CREATE TABLE IF NOT EXISTS station_comments (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id     TEXT        NOT NULL,
  station_name   TEXT,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  content        TEXT        CHECK (char_length(content) <= 500),
  status_report  TEXT        CHECK (status_report IN ('available','occupied','defect','comment')),
  lat            FLOAT8,
  lng            FLOAT8,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS station_comments_station_id_idx
  ON station_comments (station_id, created_at DESC);

ALTER TABLE station_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments (public feed)
CREATE POLICY station_comments_select ON station_comments
  FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY station_comments_insert ON station_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own comments
CREATE POLICY station_comments_delete ON station_comments
  FOR DELETE USING (user_id = auth.uid());

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON station_comments TO anon;
GRANT SELECT, INSERT, DELETE ON trips TO authenticated;
GRANT SELECT, INSERT, DELETE ON station_comments TO authenticated;
