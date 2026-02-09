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

## Wix Headless Loyalty Program 詳細

> 参考: [Wix Loyalty Accounts API](https://dev.wix.com/docs/sdk/backend-modules/loyalty/accounts/introduction)

### 概要

Wix Loyalty Program は、ポイント付与・管理・利用を一元化するシステム。
Headless 実装では **Wix JavaScript SDK** を使用してバックエンドからアクセスする。

### インストール

```bash
npm install @wix/sdk @wix/loyalty
```

### 認証方式

Headless 実装では **API Key 認証**を使用：

```typescript
import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { accounts } from "@wix/loyalty";

const wixClient = createClient({
  auth: ApiKeyStrategy({
    apiKey: process.env.WIX_API_KEY,      // API Key Manager で生成
    siteId: process.env.WIX_SITE_ID,       // Wix サイト ID
    accountId: process.env.WIX_ACCOUNT_ID, // Wix アカウント ID
  }),
  modules: { accounts },
});
```

**API Key の取得方法**:
1. [Wix API Key Manager](https://manage.wix.com/account/api-keys) にアクセス
2. 新しい API Key を生成
3. Loyalty API への権限を付与

### 利用可能なメソッド

| メソッド | 説明 | 用途 |
|---------|------|------|
| `getAccount(accountId)` | アカウント ID で取得 | 既知のアカウント照会 |
| `getAccountBySecondaryId(contactId/memberId)` | Contact ID または Member ID で取得 | **推奨**: Wix会員IDからポイント取得 |
| `getCurrentMemberAccount()` | 現在ログイン中の会員 | Wix認証使用時のみ |
| `listAccounts()` | アカウント一覧取得 | 管理画面用 |
| `queryLoyaltyAccounts()` | 高度なクエリ | フィルタリング |
| `earnPoints(accountId, points)` | ポイント付与 | 購入時等 |
| `adjustPoints(accountId, points)` | ポイント調整（+/-） | 手動調整 |
| `getProgramTotals()` | プログラム全体の統計 | ダッシュボード |

### アカウントオブジェクト構造

```typescript
interface LoyaltyAccount {
  _id: string;                    // アカウント ID
  contactId: string;              // Wix Contact ID（連携キー）
  memberId?: string;              // Wix Member ID
  balance: {
    points: number;               // 現在のポイント残高 ★重要
  };
  earned: {
    points: number;               // 累計獲得ポイント
  };
  adjusted: {
    points: number;               // 累計調整ポイント
  };
  redeemed: {
    points: number;               // 累計利用ポイント
  };
  rewardAvailability: {
    rewardsAvailable: boolean;    // 利用可能な特典があるか
  };
  _createdDate: string;
  _updatedDate: string;
}
```

### 実装例：ポイント残高取得

```typescript
// src/lib/wix.ts
import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { accounts } from "@wix/loyalty";

const wixClient = createClient({
  auth: ApiKeyStrategy({
    apiKey: process.env.WIX_API_KEY!,
    siteId: process.env.WIX_SITE_ID!,
    accountId: process.env.WIX_ACCOUNT_ID!,
  }),
  modules: { accounts },
});

/**
 * Wix Contact ID からポイント残高を取得
 * Discord ユーザーの Email → Wix Contact ID → Loyalty Account
 */
export async function getPointsBalance(wixContactId: string): Promise<number> {
  try {
    const { account } = await wixClient.accounts.getAccountBySecondaryId({
      secondaryId: {
        contactId: wixContactId,
      },
    });
    return account?.balance?.points ?? 0;
  } catch (error) {
    console.error("Failed to get loyalty account:", error);
    return 0;
  }
}

/**
 * ポイント履歴取得（将来実装）
 */
export async function getPointsHistory(wixContactId: string) {
  // Wix Loyalty API では直接的な履歴取得はなく、
  // Transactions API や Webhook で管理する必要がある
  // → Phase 2 で実装検討
}
```

### Webhook イベント

ポイント変動を検知するためのイベント：

| イベント | 発火タイミング |
|---------|---------------|
| `onAccountCreated` | 新規アカウント作成時 |
| `onAccountUpdated` | アカウント情報更新時 |
| `onAccountPointsUpdated` | **ポイント変動時** ★重要 |
| `onAccountRewardAvailabilityUpdated` | 特典利用可能状態変更時 |

### 制限事項・注意点

1. **バックエンド専用 API**
   - Loyalty API は Backend Module のため、クライアントサイドから直接呼び出せない
   - Next.js の Server Actions または API Routes で実装

2. **権限昇格が必要**
   - 一部の操作（ポイント調整等）は `elevate()` 関数で権限昇格が必要

3. **Contact ID vs Member ID**
   - `contactId`: Wix CRM のコンタクト ID（必須）
   - `memberId`: Wix Members のログイン会員 ID（任意）
   - p.aicu.jp では `contactId` を使用（Discord Email でマッチング）

4. **レート制限**
   - Wix API には呼び出し制限あり（具体的な数値は要確認）
   - キャッシュ戦略の検討が必要

### p.aicu.jp での実装方針

```
[Discord OAuth]
     ↓ email 取得
[Supabase member_links]
     ↓ wix_contact_id 検索
[Wix Loyalty API] getAccountBySecondaryId(contactId)
     ↓ balance.points 取得
[Dashboard] ポイント表示
```

**初回連携フロー**:
1. Discord ログイン → Email 取得
2. Wix Contacts API で Email 検索 → Contact ID 取得
3. Supabase に Discord ID ↔ Contact ID マッピング保存
4. 以降は Supabase から Contact ID を取得してポイント照会

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

# Wix Headless（API Key 認証）
WIX_API_KEY=          # API Key Manager で生成
WIX_SITE_ID=          # Wix サイト ID（サイト設定から取得）
WIX_ACCOUNT_ID=       # Wix アカウント ID

# Wix Headless（OAuth 認証 - 代替）
WIX_CLIENT_ID=        # OAuth App の Client ID（将来用）

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

**Wix Site ID の取得方法**:
1. Wix ダッシュボード → サイト設定
2. または URL から: `https://manage.wix.com/dashboard/{SITE_ID}/...`

---

## 関連リソース

### 内部リソース
- **リポジトリ**: https://github.com/aicuai/p-aicu-ai
- **経営会議Issue**: https://github.com/aicuai/japan-corp/issues/124

### Wix Headless ドキュメント
- **Wix Headless 概要**: https://dev.wix.com/docs/go-headless
- **JavaScript SDK**: https://dev.wix.com/docs/sdk/articles/get-started/about-the-wix-java-script-sdk
- **API Key 認証**: https://dev.wix.com/docs/go-headless/develop-your-project/admin-operations/create-a-java-script-sdk-client-with-an-api-key
- **Loyalty Accounts API**: https://dev.wix.com/docs/sdk/backend-modules/loyalty/accounts/introduction
- **API Key Manager**: https://manage.wix.com/account/api-keys

### その他
- **NextAuth.js v5**: https://authjs.dev/
- **Supabase**: https://supabase.com/docs

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
