# GA4 Data API セットアップガイド

GA4ダッシュボード (`/dashboard/ga4`) を動作させるために必要な GCP + GA4 の設定手順です。

---

## 1. GCPサービスアカウント作成

1. [GCPコンソール](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. **IAMと管理 → サービスアカウント** に移動
4. **サービスアカウントを作成** をクリック
   - 名前: `ga4-reader` (任意)
   - 説明: `GA4 Data API read access for p.aicu.jp`
5. 作成したサービスアカウントの **鍵** タブで **鍵を追加 → 新しい鍵 → JSON** を選択
6. ダウンロードされた JSON ファイルを安全に保管

## 2. GA4 Data API を有効化

1. GCPコンソールで **APIとサービス → ライブラリ** に移動
2. **Google Analytics Data API** を検索して **有効にする**

## 3. GA4プロパティにサービスアカウントを追加

1. [Google Analytics](https://analytics.google.com/) にアクセス
2. **管理（Admin）→ プロパティ → プロパティアクセス管理** に移動
3. **ユーザーを追加** をクリック
4. サービスアカウントのメールアドレス（`ga4-reader@xxx.iam.gserviceaccount.com`）を入力
5. 権限: **閲覧者（Viewer）** を選択して保存

## 4. 環境変数を設定

### GA4_CREDENTIALS_BASE64

ダウンロードした JSON 鍵ファイルを Base64 エンコード:

```bash
base64 -i path/to/service-account-key.json | tr -d '\n'
```

### GA4_PROPERTY_ID

GA4のプロパティID（数字のみ）。
Google Analytics → 管理 → プロパティ設定 → プロパティID で確認できます。

### .env.local に追加

```
GA4_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZ...（Base64文字列）
GA4_PROPERTY_ID=123456789
```

### Vercel に追加

Vercel Dashboard → Settings → Environment Variables で同じ2つの変数を追加。

---

## 5. 動作確認

```bash
npm run dev
# http://localhost:3200/dashboard/ga4 にアクセス
```

スーパーユーザー（`src/lib/constants.ts` に定義）でログインしてアクセスしてください。

---

## GA4プロパティ情報

| ストリーム名 | Stream ID | 状態 |
|:------------|:----------|:-----|
| AICUjp→AICU.blog (www.aicu.blog) | 10401142105 | アクティブ |
| aicu.jp | 13590341306 | アクティブ |
| Gemini-CoDrawing | 12088235980 | - |
| AI価値創出白書 | 13038509086 | - |
| Oshi-Player | 13238148560 | - |
