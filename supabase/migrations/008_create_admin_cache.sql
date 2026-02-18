-- Admin cache table for expensive API results (Wix Loyalty, etc.)
CREATE TABLE IF NOT EXISTS admin_cache (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
