-- unified_users: Discord ↔ Wix ↔ Stripe のユーザーマッピングテーブル
CREATE TABLE unified_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT UNIQUE NOT NULL,
  discord_email TEXT,
  discord_username TEXT,
  wix_contact_id TEXT UNIQUE,
  wix_member_id TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  primary_email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX idx_unified_users_discord_id ON unified_users (discord_id);
CREATE INDEX idx_unified_users_wix_contact_id ON unified_users (wix_contact_id);
CREATE INDEX idx_unified_users_primary_email ON unified_users (primary_email);
