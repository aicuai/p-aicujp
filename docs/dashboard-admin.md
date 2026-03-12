# AICU Admin Dashboard — 設計と運用ガイド

**URL**: https://p.aicu.jp/dashboard/admin
**更新日**: 2026-02-24
**ソース**: `src/app/dashboard/admin/page.tsx`

---

## コンセプト

Admin Dashboardは、AICU会員ポータル (p.aicu.jp) の運営状況をひと目で把握するための管理画面です。
Wix CRM をベースとした**会員ファネル**を軸に、調査の進捗、ポイント付与の状況、サイトの利用状況をリアルタイムに表示します。

アクセスできるのは `src/lib/constants.ts` に定義されたスーパーユーザーのみです。

---

## 画面構成（上から順）

### 1. 会員ファネル

Wix連絡先（CRM全体）をベースに、どこまで「濃い」会員になっているかを可視化します。

| 層 | 意味 | データソース |
|:---|:-----|:------------|
| **Wix 連絡先** | CRM上の全接触者（フォーム送信、ゲスト購入等を含む） | Wix Contacts API |
| **Wix サイト会員** | Wixサイト上で会員登録した人 | Wix Members API |
| **調査参加者（Free）** | R2602等の調査にメールアドレス付きで回答した人 | `survey_responses` (email IS NOT NULL) |
| **基本会員（Basic）** | 基本AICU会員プラン（有料）に加入中 | Wix Pricing Plans API |
| **Lab+ 会員** | AICU Lab+ プランに加入中 | Wix Pricing Plans API |

各層の間にコンバージョン率（`% ↓`）を表示。
ファネルの下には **p.aicu.jp 登録者**（Supabase Auth完了）と**7日アクティブ**（WAU）を並べて表示します。

> **なぜ連絡先 500人超に対してユーザーが数人なのか？**
> Wix連絡先はCRM上の全接触者。p.aicu.jpユーザーはメール認証（マジックリンク）を完了した人のみ。調査回答者はWixのFree会員相当として扱い、ファネル上で位置付けています。

### 2. メールリスト取得

Wix Contacts APIからメールアドレスを一括エクスポートするツール。
キャンペーンメール送信の準備に使用します。

### 3. 調査回答

#### 総回答数とサーベイ別内訳
- R2511 / R2602 の個別件数を色分け表示

#### 回答数推移（累計・全調査合計）
- 日次の回答数を累計した折れ線グラフ（recharts）
- 目標ライン（100, 200, 300）を破線で表示

#### R2511 vs R2602 成長比較
- 2つの調査を**開始日からの経過日数**で揃えて比較するチャート
- R2511（紫・破線）: 2025-11-05 〜 12-08、33日間で53件
- R2602（ティール・実線）: 2026-02-19 〜 進行中
- R2511最終値（53件）を参照線として表示
- 1日あたりのペース比較を数値表示

#### 離脱ファネル
- R2602の調査フォーム内の進捗ビーコン（`survey_kv`テーブル）から、セクション別の到達率を可視化
- LP到達 → ゲート通過 → 基本情報 → ... → VoC・メール
- 赤: 30%以上離脱 / 黄: 15%以上離脱

#### AICUポイント付与状況
- メール提供者 / 匿名回答の内訳
- 付与済み / 処理中 / 失敗の件数とプログレスバー
- メール登録率、1件あたりコスト（10,000pt = 1,000円換算）
- **失敗エントリー一覧**: 失敗したポイント付与の対象メール・日時を表示
- **「全件リトライ」ボタン**: 失敗分をWix Loyalty API経由で再試行（`/api/admin/retry-rewards`）

#### 最新のエントリー
- 直近10件の回答（survey_id、メールプレフィックス、報酬ステータス、日時）

### 4. AICUポイント（Loyalty）
- `admin_cache` テーブルにキャッシュされたLoyalty集計（cronジョブで更新）
- アカウント数、総発行・消費ポイント、消費率、残高合計

### 5. 最近のログイン
- `unified_users` テーブルの `last_login_at` 降順で直近10件
- Wix連携・Discord連携のステータスバッジ

---

## データソース一覧

| データ | テーブル / API | 更新タイミング |
|:-------|:--------------|:-------------|
| ユーザー数 | `unified_users` | ログイン時にupsert |
| 調査回答 | `survey_responses` | 回答送信時にinsert |
| 離脱ファネル | `survey_kv` (key=progress) | フォーム進捗ごとにupsert |
| Wix連絡先・会員数 | Wix Contacts/Members API | ページ読み込み時にリアルタイム取得 |
| サブスクリプション | Wix Pricing Plans API | ページ読み込み時にリアルタイム取得 |
| Loyaltyポイント | `admin_cache` (key=loyalty-summary) | cronジョブ `/api/cron/loyalty-cache` |
| Push購読 | `push_subscriptions` | ユーザー操作時 |

---

## 報酬（ポイント付与）フロー

```
調査回答 POST /api/surveys/[id]
  → survey_responses に insert (reward_status: "pending")
  → triggerReward() を fire-and-forget で実行
    → awardPointsByEmail() (src/lib/wix.ts)
      1. Wix Contact を検索（なければ REST で作成）
      2. Loyalty アカウントを取得（なければ REST で作成）
      3. earnPoints() でポイント付与
    → 成功: reward_status = "confirmed"
    → 失敗: reward_status = "failed"
```

### 失敗の主な原因
- **Vercel function のタイムアウト**: triggerReward はレスポンス返却後にバックグラウンド実行されるため、Vercelが関数を終了させると中途失敗する
- **Wix API の一時エラー**: レート制限や一時的な接続障害
- **連絡先作成の失敗**: まれにWix REST APIが500を返す

### リトライ方法
1. Admin Dashboard の「全件リトライ」ボタン（推奨）
2. `node scripts/retry-pending-rewards.mjs --include-failed --send`（CLIから実行）

---

## 技術メモ

- サーバーコンポーネント（RSC）として実装。ページ読み込み時に全データを並列取得（`Promise.all`）
- Wix API呼び出しは `try/catch` で囲み、エラー時も他のセクションは表示される
- チャートは recharts（`SurveyProgressChart`, `SurveyComparisonChart`）— client component
- リトライボタンは client component（`RetryRewardsButton`）
- R2511データは GAS API からインポート済み（`scripts/import-r2511.mjs`）。email は null（GAS側でリダクト済み）

---

## 既知の課題と今後

- [ ] **reward_error カラムの活用**: 2026-02-24 に追加済み。今後は失敗理由をDBに記録し、ダッシュボードに表示する
- [ ] **p.aicu.jpユーザー数の向上**: 調査回答後にアカウント登録を促す導線の追加
- [ ] **R2511のメールアドレス復元**: GAS側でリダクトされているため、R2511回答者へのポイント付与は不可。今後の調査ではメール保持を前提とする
- [ ] **Vercel function タイムアウト対策**: triggerReward を Vercel の `waitUntil()` に移行、またはキュー化して確実に完了させる
- [ ] **日次レポートとの統合**: `/api/cron/daily-report` で生成されるSlack通知との指標統一
- [ ] **Wix連絡先のクリーンアップ**: 543件中、空レコードや自動生成分を除外した実質連絡先数の表示
