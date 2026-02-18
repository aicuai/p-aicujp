# Session Context

**Session ID:** 0a9df89c-7edf-4220-ad9a-2f459194827c

**Commit Message:** Implement the following plan:

# R2602 設問別コメンタリー関数の実装プラン

## Context
R26

## Prompt

Implement the following plan:

# R2602 設問別コメンタリー関数の実装プラン

## Context
R2602 結果ページでは各チャートの下に `StatsFooter`（回答率・最頻値・多様性）のみ表示。
note記事のような設問ごとの分析コメント（PI分析視点）を、統計データに基づいて動的に生成する関数を作成する。
Phase 4 の LLM コメンタリーの前段階として、テンプレート＋実データの「ルールベース・コメンタリー」を実装。

## 設計方針

### コメンタリーの構成（設問あたり2〜3文）
1. **文脈（静的）** — この設問が何を測定しているか、なぜ重要か
2. **データインサイト（動的）** — 実データを参照した分析（最頻値, %, エントロピー等）
3. **PI視点（条件付き）** — 特筆すべき傾向がある場合のみ追加（例: 多様性が高い/低い、偏りが大きい）

### 関数シグネチャ

```typescript
// src/lib/survey-commentary.ts

type CommentaryInput = {
  id: string
  counts: Record<string, number>
  answered: number
  totalResponses: number
  stats: { responseRate: number; mode: string; modePct: number; entropy: number }
}

/** 設問IDに対応するコメンタリーを生成。対応なしの場合は null */
export function getQuestionCommentary(input: CommentaryInput): string | null
```

### 動的要素の例
- `「${stats.mode}」が${stats.modePct}%で最多` — 最頻値の引用
- エントロピーに基づく分散評価: 高い→「回答は多様に分散」/ 低い→「特定の選択肢に集中」
- 回答率に基づく注釈: 低い→「この設問はスキップ率が高く…」
- 上位N件の列挙（multi_choice向け）

### 対象設問と主なコメンタリーテーマ

| 設問ID | テーマ | コメンタリー方針 |
|--------|--------|-----------------|
| `entry_170746194` | 年齢 | 年代バケット分布、主力世代の特定 |
| `entry_1821980007` | 性別 | ジェンダーバランス、テック業界比較 |
| `entry_1957471882` | 職業 | フリーランス比率、働き方の特徴 |
| `entry_1357554301` | 地域 | 地域偏在、リモートワーク示唆 |
| `entry_1228619554` | AI関係性 | 自認カテゴリ分布 |
| `entry_885269464` | セクター | 個人vs組織 |
| `entry_2077750738` | AI領域 | テキスト/画像/動画の浸透度 |
| `entry_35926345` | 有償実績 | 収益化の二極化 |
| `entry_274138831` | 売上帯 | 収益規模のグラデーション |
| `entry_1024046675` | AI月額費用 | ツールコスト実態 |
| `entry_998532907` | 学習投資 | 独学傾向 |
| `entry_2000848438` | 学習方法 | 情報の民主化 |
| `entry_1829344839` | OS/ハード | Windows vs Mac |
| `entry_505387619` | GPU | 計算環境 |
| `entry_1878680578` | ツール | ChatGPT浸透度、動画ツール台頭 |
| `Q_effect_done/want` | 効果対比 | 時間短縮vs新規受注のギャップ |
| `entry_34298640` | AI態度 | 「必須」の過半数超え |
| `entry_537892144` | ボトルネック | コストvs著作権 |
| `entry_722928489` | 証明価値 | 倫理観・信頼の重要性 |
| `entry_333973041` | プラットフォーム | SNS主導の発表スタイル |
| `entry_448099795` | 二次創作 | 権利意識 |
| `entry_454206106` | 著作権 | プラットフォーマー責任論 |
| `dcaj_Q1`〜`dcaj_Q9` | DCAJ系 | 倫理・法制度・クリエイター価値 |

### paired-bar 専用コメンタリー
`computeGapAnalysis()` の結果を使い、「実現」と「期待」のギャップが大きい項目を自動抽出。
例: 「『新規受注への貢献』は期待が実現を大きく上回り、今後の伸びしろを示している」

### pyramid 専用コメンタリー
クロス集計データから性別×年代の特徴を自動生成。
例: 「30代女性が最多で、キャリア転換期にAIを活用する傾向」

## 修正ファイル

### 新規: `src/lib/survey-commentary.ts`
- `getQuestionCommentary()` — メイン関数
- 内部に設問ID→テンプレート関数のマップ
- ヘルパー: `topN()`, `entropyLevel()`, `gapInsight()` 等

### 修正: `src/app/q/R2602/results/ResultsClient.tsx`
- `ChartCard` 内で `getQuestionCommentary()` を呼び出し
- StatsFooter の上にコメンタリーテキストを表示
- スタイル: 薄いグレー背景、左ボーダー付き、fontSize 12
- paired-bar / pyramid にも対応

### 既存利用: `src/lib/survey-stats.ts`
- `computeStats()` の返り値をそのまま活用（追加関数不要）
- `computeGapAnalysis()` を paired-bar コメンタリーで利用

## UI デザイン

```
┌─────────────────────────────────┐
│  Q: あなたの性別を教えてください    │
│  52件の回答                        │
│                                   │
│  [===== チャート =====]           │
│                                   │
│  ┌ コメンタリー ─────────────────┐ │
│  │ 女性が57.7%と男性を上回る。   │ │
│  │ 生成AIが自然言語で操作する    │ │
│  │ ツールであることが、ジェンダー │ │
│  │ ギャップ縮小に寄与している    │ │
│  │ 可能性がある。               │ │
│  └──────────────────────────────┘ │
│  回答率 98% | 最多: 女性 (57.7%) │
│  | 多様性 1.43                    │
└─────────────────────────────────┘
```

## 実装順序
1. `survey-commentary.ts` 作成（全設問のテンプレート関数）
2. `ResultsClient.tsx` にコメンタリー表示を統合
3. ビルド確認

## 検証方法
```bash
npm run build
npm run dev
# http://localhost:3200/q/R2602/results
# 各チャートの下にコメンタリーが表示されること
# 動的な数値（%、最頻値）が正しく反映されていること
```


If you need specific details from before exiting plan mode (like exact code snippets, error messages, or content you generated), read the full transcript at: /Users/aki/.claude/projects/-Users-aki-git-local-p-aicujp/e1f8dfff-1316-491c-baeb-415ddd57faea.jsonl

## Summary

Build passes cleanly. Here's a summary of what was implemented:

**New file: `src/lib/survey-commentary.ts`**
- `getQuestionCommentary()` — main function for single-question commentary (25 question templates)
- `getPairedBarCommentary()` — paired-bar gap analysis commentary (done vs want)
- `getPyramidCommentary()` — population pyramid cross-tabulation commentary
- Helpers: `topN()`, `entropyLevel()`, `responseRateNote()`, `listTop()`
- Each template generates 2-3 sentences: context (static) + data insight (dynamic) + PI perspective (conditional)

**Modified: `src/app/q/R2602/results/ResultsClient.tsx`**
- Imported commentary functions + `computeGapAnalysis`
- Added `Commentary` component (grey background, teal left border, 12px font)
- Integrated commentary into all 4 card types: single, paired-bar, age-pie, pyramid
- Commentary displays between chart and `StatsFooter`

## Key Actions

- - **Read**: /Users/aki/git.local/p-aicujp/src/lib/survey-stats.ts
- - **Read**: /Users/aki/git.local/p-aicujp/src/app/q/R2602/results/ResultsClient.tsx
- - **Read**: /Users/aki/git.local/p-aicujp/src/lib/survey-viz-config.ts
- - **TaskCreate**: Create src/lib/survey-commentary.ts with getQuestionCommentary() function, helper utilities (topN, entropyLevel, gapInsight), and commentary templates for all ~25 questions including paired-bar and pyramid special cases.
- - **TaskCreate**: Import getQuestionCommentary, call it for each chart card, display commentary with styled box (grey background, left border) between chart and StatsFooter. Handle single, paired-bar, pyramid, and age-pie card types.
- - **TaskCreate**: Run npm run build to ensure no TypeScript errors, then verify on dev server.
- - **TaskUpdate**: 
- - **Write**: /Users/aki/git.local/p-aicujp/src/lib/survey-commentary.ts
- - **TaskUpdate**: 
- - **TaskUpdate**: 
