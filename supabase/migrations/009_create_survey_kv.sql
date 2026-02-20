-- survey_kv: generic key-value store for survey-related data
-- Used for progress beacons (funnel/drop-off analysis), per-session state, etc.
-- Reusable across all R26xx surveys without creating per-survey tables.

CREATE TABLE IF NOT EXISTS survey_kv (
  survey_id   text        NOT NULL,
  session_id  text        NOT NULL,  -- client-generated UUID per browser session
  key         text        NOT NULL,
  value       jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (survey_id, session_id, key)
);

-- Index for admin dashboard queries (funnel by survey)
CREATE INDEX idx_survey_kv_survey ON survey_kv (survey_id, key);

-- RLS: allow inserts/updates from anon role (public survey beacon), reads from service role only
ALTER TABLE survey_kv ENABLE ROW LEVEL SECURITY;

-- Anon can insert and update their own session data
CREATE POLICY "anon_insert_survey_kv" ON survey_kv
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_survey_kv" ON survey_kv
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Service role can read all (admin dashboard)
CREATE POLICY "service_read_survey_kv" ON survey_kv
  FOR SELECT TO service_role
  USING (true);
