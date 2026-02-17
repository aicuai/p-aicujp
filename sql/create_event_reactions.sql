-- event_reactions: イベントセッションへのリアクション
-- 用途: 参加したい / 視聴したい / シェア のカウント (IP dedup)
-- 運用: p.aicu.jp API 経由

CREATE TABLE IF NOT EXISTS event_reactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_code text NOT NULL,        -- 'Fes26Halu'
  session_id text NOT NULL,        -- 'keynote', 'vibe', 'video', 'manga', 'aihub'
  action text NOT NULL CHECK (action IN ('like', 'want_video', 'share')),
  ip_hash text NOT NULL,           -- SHA256 先頭16文字
  created_at timestamptz DEFAULT now(),

  -- 同一 IP からの同一アクションは1回のみ
  UNIQUE(event_code, session_id, action, ip_hash)
);

ALTER TABLE event_reactions ENABLE ROW LEVEL SECURITY;

-- 集計用インデックス
CREATE INDEX IF NOT EXISTS idx_event_reactions_count
  ON event_reactions(event_code, session_id, action);

COMMENT ON TABLE event_reactions IS 'イベントセッションリアクション。IP dedup で1人1票。';
