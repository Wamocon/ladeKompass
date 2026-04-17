-- Migration: Saved routes table
-- Allows users to save and archive their calculated routes

CREATE TABLE IF NOT EXISTS "ladekompass-dev".saved_routes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name         TEXT,                         -- user-provided label (optional)
  result       JSONB NOT NULL,               -- serialised RouteResult
  input        JSONB NOT NULL DEFAULT '{}',  -- serialised CalculateRouteInput
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Efficient lookup by user
CREATE INDEX IF NOT EXISTS saved_routes_user_idx
  ON "ladekompass-dev".saved_routes (user_id, created_at DESC);

-- RLS: each user sees only their own routes
ALTER TABLE "ladekompass-dev".saved_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_routes_select"
  ON "ladekompass-dev".saved_routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_routes_insert"
  ON "ladekompass-dev".saved_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_routes_delete"
  ON "ladekompass-dev".saved_routes FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON "ladekompass-dev".saved_routes TO authenticated;
