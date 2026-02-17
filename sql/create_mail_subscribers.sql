-- mail_subscribers: メールニュース購読者
-- 用途: イベント通知、AICU ニュース配信
-- 運用: p.aicu.jp API 経由で登録・解除

CREATE TABLE IF NOT EXISTS mail_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,

  -- 配信カテゴリ: events (イベント全般), news (AICU ニュース), products (サービス更新)
  categories text[] NOT NULL DEFAULT '{events}',

  -- イベントコード: Fes26Halu, Fes25s, etc. (購読中のイベント)
  events text[] NOT NULL DEFAULT '{}',

  -- 言語設定
  lang text NOT NULL DEFAULT 'ja' CHECK (lang IN ('ja', 'en')),

  -- 登録元トラッキング
  source text,  -- 'fes26halu_lp', 'fes26halu_chat', 'aicu_jp', etc.

  -- スパム防止
  ip_hash text,  -- SHA256 先頭16文字

  -- 解除用トークン (メール内リンクで使用)
  unsub_token text DEFAULT encode(gen_random_bytes(16), 'hex'),

  -- ステータス管理
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,

  -- 同一メールは1レコード (カテゴリ・イベントは配列で管理)
  UNIQUE(email)
);

-- RLS: service key のみ操作可能 (API 経由)
ALTER TABLE mail_subscribers ENABLE ROW LEVEL SECURITY;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_mail_subscribers_status ON mail_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_mail_subscribers_events ON mail_subscribers USING GIN(events);
CREATE INDEX IF NOT EXISTS idx_mail_subscribers_categories ON mail_subscribers USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_mail_subscribers_unsub_token ON mail_subscribers(unsub_token);

-- コメント
COMMENT ON TABLE mail_subscribers IS 'メールニュース購読者。p.aicu.jp API 経由で管理。';
COMMENT ON COLUMN mail_subscribers.categories IS '配信カテゴリ: events, news, products';
COMMENT ON COLUMN mail_subscribers.events IS 'イベントコード: Fes26Halu, Fes25s, etc.';
COMMENT ON COLUMN mail_subscribers.source IS '登録元: fes26halu_lp, fes26halu_chat, aicu_jp';
COMMENT ON COLUMN mail_subscribers.unsub_token IS 'メール内解除リンク用トークン';
