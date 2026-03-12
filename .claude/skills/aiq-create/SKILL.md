---
name: aiq-create
description: Create a new closed (non-open) AIQ survey for workshops, events, or internal use. Use when user says "create survey", "new questionnaire", "アンケート作成", "新しい調査".
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
argument-hint: "[survey_id] [title]"
---

# AIQ アンケート作成スキル

ユーザーの指示に基づいて、新しいクローズドアンケートを作成します。

## 手順

1. **要件確認**: ユーザーからサーベイID、タイトル、設問内容を聞く
   - サーベイIDの命名規則: `WS` + 日付6桁 (例: `WS260313`)
   - 引数: `$ARGUMENTS[0]` = サーベイID, `$ARGUMENTS[1]` = タイトル

2. **設問定義ファイル作成**: `src/data/surveys/{ID}.ts`
   - 既存の `src/data/surveys/WS260313.ts` をテンプレートとして参照
   - `SurveyConfig` 型に準拠
   - `skipGate: true` (クローズドアンケートはゲートスキップ)
   - 質問タイプ: `single_choice`, `multi_choice`, `textarea`, `text`, `dropdown`, `section`

3. **レジストリ登録**: `src/data/surveys/index.ts`
   - `registry` に動的import追加
   - `ALL_SURVEY_IDS` 配列に追加

4. **ダッシュボード登録**: `src/app/dashboard/aiq/page.tsx`
   - `AIQ_SURVEY_IDS` 配列に追加
   - `SURVEY_TITLES` にタイトル追加
   - `SURVEY_URLS` にURL追加
   - `friendlyLabel()` にカラムラベル追加

5. **ビルド確認**: `npm run build` でエラーがないことを確認

## 注意事項

- クローズドアンケートは報酬なし（`reward` フィールドなし）が基本
- メールアドレス欄はオプションで追加可能
- `submitUrl` は `/api/surveys/{ID}` の形式
- `opensAt`/`closesAt` で期間制御
- 完了後 `git add` / `git commit` してプッシュ

## テンプレート構造

```typescript
import type { SurveyConfig } from "./index"

export const {ID}_CONFIG: SurveyConfig = {
  title: "...",
  description: "...",
  submitUrl: "/api/surveys/{ID}",
  estimatedMinutes: N,
  skipGate: true,
  opensAt: "YYYY-MM-DDT00:00:00+09:00",
  closesAt: "YYYY-MM-DDT23:59:59+09:00",
  questions: [
    // ... questions
  ],
}
```
