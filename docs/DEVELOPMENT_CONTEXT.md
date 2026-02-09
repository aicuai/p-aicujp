# p.aicu.jp 開発経緯とコンセプト

> このドキュメントは p-aicu-ai リポジトリの開発背景、CEO決定事項、技術的判断を記録したものです。
> 並行セッションや将来の開発者向けのコンテキスト共有を目的としています。

## 背景：なぜ p.aicu.jp が必要なのか

### 現状の課題（2025/02時点）

1. **Wixサイトの問題点**
   - サイトが重たい（ページ読み込み遅延）
   - デザインが古臭い
   - スマホレスポンシブが不十分
   - Wix独自の制約による開発柔軟性の欠如

2. **ユーザー体験の課題**
   - AICUポイント確認がわかりにくい
   - Discordコミュニティとの連携が不明確
   - 会員情報の一元管理ができていない

### CEO決定事項（2025/02/09）

> 「ユーザーが不安にならないようにポイント機能を先に移植したい」
> — AICU Japan CEO

**重要な方針転換**: 当初は aicu.jp 全体のヘッドレス化を 3/1 に実施する予定だったが、**ユーザー心理を考慮し、ポイント確認機能を先行リリース**することに決定。

### 意思決定の流れ

1. 「Wixのヘッドレス化」が週次議題として挙がる
2. aicu.jp 全体の 3/1 リリースを検討
3. CEOが「ユーザーが不安にならないよう、ポイント機能を先に」と提案
4. `profile.aicu.jp` → `p.aicu.jp` とドメイン決定
5. コンセプトを「Point, Profile, Post」の 3P に拡張
6. 2/14 先行リリース、3/1 本体移行というスケジュールに変更

---

## コンセプト：3P（Point, Profile, Post）

p.aicu.jp は「3P」をコアコンセプトとする会員専用ポータル。

| P | 機能 | 詳細 | 優先度 |
|---|------|------|--------|
| **Point** | AICUポイント | Wix Loyalty APIから取得・表示。ユーザーが自分のポイント残高を確認できる | **最優先** |
| **Profile** | 会員情報 | Discord連携状況、メールアドレス、会員プラン、Stripe決済情報 | Phase 2 |
| **Post** | お知らせ・投稿 | Discord連携による通知、AICU公式アナウンス、将来的にはコンテンツ投稿 | Phase 3 |

### なぜ「Point」を最優先するのか

Wix → ヘッドレス移行において、ユーザーが最も気にするのは **「自分のポイントは大丈夫か？」** という点。

p.aicu.jp を先行リリースすることで：
- 移行前に「ポイントは安全に引き継がれます」と示せる
- ユーザーが自分でポイント残高を確認できる安心感
- 本体移行時のクレーム・問い合わせを予防

**CEOの意図**: 技術的な移行より、ユーザーの心理的安全を優先する

---

## タイムライン

```
2025/02/09 (月) - プロジェクト開始、p-aicu-ai リポジトリ作成
                   - Discord OAuth ログイン UI 実装
                   - ダッシュボード基本構造

2025/02/14 (金) - p.aicu.jp 先行公開【マイルストーン】
                   - Discord OAuth ログイン
                   - ポイント残高表示
                   - 基本プロフィール表示

2025/03/01 (土) - aicu.jp 本体ヘッドレス移行
                   - Next.js + Vercel で完全リプレイス
                   - Shop機能維持（Wix eCommerce API）
                   - コミュニティ → Discord完全移行
```

**注意**: 木曜日は Akane 作業日のため、金曜日にリリースを集中させる方針。

---

## 技術アーキテクチャ

### 認証フロー（重要）

```
[ユーザー]
    ↓ Discord OAuth ログイン
[p.aicu.jp (Next.js)]
    ↓ Discord ID + Email 取得
[Supabase] Discord ↔ Wix メンバーID マッピングテーブル
    ↓ Wix Member ID 特定（Email でマッチング）
[Wix Loyalty API]
    ↓ ポイント残高取得
[p.aicu.jp] ダッシュボードに表示
```

### 技術スタック

| レイヤー | 技術 | 理由 |
|---------|------|------|
| フロントエンド | Next.js 15 (App Router) | Vercelとの親和性、RSC対応 |
| 認証 | NextAuth.js v5 (beta.30) | Discord OAuth、最新API対応 |
| スタイリング | Tailwind CSS + Liquid Glass | AICU統一デザイン |
| API | Wix Headless SDK | 既存ポイント・会員データ活用 |
| 決済 | Stripe | 課金管理、Customer Portal |
| DB | Supabase | Discord↔Wix連携テーブル |
| ホスティング | Vercel | Next.js最適化、エッジ配信 |
| UIパッケージ | @aicujp/ui | 共通コンポーネント |

### Discord ↔ Wix 連携の課題と解決策

**課題**: Discord OAuth で取得できるのは Discord ID のみ。Wix 会員との紐付けが必要。

**解決策**: Supabase にマッピングテーブルを作成

```sql
CREATE TABLE member_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discord_id TEXT UNIQUE NOT NULL,
  wix_member_id TEXT,
  email TEXT,
  linked_at TIMESTAMP DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE
);
```

**連携フロー**:
1. 初回ログイン時、Discord メールアドレスを取得
2. Wix CRM で同一メールの会員を検索
3. 一致すれば自動リンク、なければ手動確認を促す

### Wix API 連携

**Wix Loyalty API** を使用してポイント情報を取得：

```typescript
import { createClient, OAuthStrategy } from '@wix/sdk';
import { loyalty } from '@wix/loyalty';

const wixClient = createClient({
  modules: { loyalty },
  auth: OAuthStrategy({ clientId: process.env.WIX_CLIENT_ID }),
});

// メンバーIDからアカウント取得
const account = await wixClient.loyalty.getAccount(wixMemberId);
const points = account.balance?.points || 0;
```

---

## ユーザーデータ（2025/02時点）

| 項目 | 数値 | 備考 |
|------|------|------|
| Wix 会員 | 約100名 | アクティブ会員 |
| Wix CRM コンタクト | 513名 | メルマガ登録含む |
| Stripe 課金顧客 | 4名 | 有料プラン加入者 |
| Discord コミュニティ | 要確認 | 連携対象 |

---

## 開発優先順位

### Phase 1（2/14 リリース）- Point 重視 【現在ここ】
- [x] Discord OAuth ログイン UI
- [x] ダッシュボード基本レイアウト
- [x] Liquid Glass デザイン適用
- [ ] Wix OAuth App 作成
- [ ] Wix Loyalty API 連携
- [ ] ポイント残高表示（実データ）
- [ ] レスポンシブ調整

### Phase 2（2/14〜3/1）- Profile 強化
- [ ] Stripe Customer Portal 連携
- [ ] 会員プラン表示・変更
- [ ] Discord ↔ Wix 自動リンク
- [ ] ポイント履歴表示

### Phase 3（3/1〜）- Post 機能
- [ ] お知らせ一覧表示
- [ ] Discord 通知連携
- [ ] コンテンツ投稿機能

---

## 残タスク・ブロッカー

### 必須（2/14 までに必要）

1. **Wix OAuth App の作成**
   - Wix Developers Console で Headless アプリを作成
   - Loyalty API の権限を有効化
   - Client ID / API Key 取得

2. **Supabase セットアップ**
   - member_links テーブル作成
   - Row Level Security 設定

3. **Vercel デプロイ設定**
   - p.aicu.jp ドメイン設定
   - 環境変数設定

### 環境変数一覧

```bash
# Discord OAuth
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# Wix Headless
WIX_CLIENT_ID=
WIX_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://p.aicu.jp
```

---

## 関連リソース

- **リポジトリ**: https://github.com/aicuai/p-aicu-ai
- **経営会議Issue**: https://github.com/aicuai/japan-corp/issues/124
- **Wix API ドキュメント**: https://dev.wix.com/docs/sdk/api-reference/loyalty
- **NextAuth.js v5**: https://authjs.dev/

---

## 注意事項（開発者向け）

1. **デザインシステム**
   - `@aicujp/ui` パッケージを使用
   - Liquid Glass スタイルを適用（CSS変数で定義）
   - AICU ブランドカラー: Primary (`--aicu-primary`), Secondary, Accent

2. **認証の実装**
   - NextAuth.js v5 (beta) を使用
   - `src/lib/auth.ts` に設定
   - Server Actions で signIn/signOut

3. **コンポーネント構成**
   - Server Component をデフォルトに
   - Client Component は明示的に `"use client"` 宣言
   - `DashboardNav` は bottom navigation として実装済み

---

*最終更新: 2025/02/09*
*作成者: Claude Code (japan-corp session)*
*目的: 並行開発セッションへのコンテキスト共有*
