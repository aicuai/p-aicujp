-- Survey responses table
-- Stores anonymous + optional-email survey answers as JSONB
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id TEXT NOT NULL,          -- e.g. "dcaj-followup-2026-01", "R2602"
  answers JSONB NOT NULL,           -- { "Q1": [...], "Q2": "text", ... }
  email TEXT,                       -- optional, for reward delivery
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT,                     -- SHA-256 of IP for dedup (not raw IP)
  user_agent TEXT
);

-- Index for querying by survey
CREATE INDEX idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_submitted_at ON survey_responses(submitted_at);

-- No RLS — accessed only via service key from p-aicujp backend
