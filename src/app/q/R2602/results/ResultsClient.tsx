"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { VIZ_MAP, PAIRED_BAR_IDS } from "@/lib/survey-viz-config"
import type { VizType } from "@/lib/survey-viz-config"
import { useMyAnswers } from "@/lib/use-my-answers"
import { computeStats, computeGapAnalysis } from "@/lib/survey-stats"
import { getQuestionCommentary, getPairedBarCommentary, getPyramidCommentary } from "@/lib/survey-commentary"

// Dynamic imports to avoid SSR issues with recharts
const StackedBar = dynamic(() => import("@/components/charts/StackedBar"), { ssr: false })
const DonutChart = dynamic(() => import("@/components/charts/DonutChart"), { ssr: false })
const RegionalPieChart = dynamic(() => import("@/components/charts/RegionalPieChart"), { ssr: false })
const AgeBucketChart = dynamic(() => import("@/components/charts/AgeBucketChart"), { ssr: false })
const TagCloud = dynamic(() => import("@/components/charts/TagCloud"), { ssr: false })
const PairedBarChart = dynamic(() => import("@/components/charts/PairedBarChart"), { ssr: false })
const HorizontalBarChart = dynamic(() => import("@/components/charts/HorizontalBarChart"), { ssr: false })
const TreemapChart = dynamic(() => import("@/components/charts/TreemapChart"), { ssr: false })
const PopulationPyramid = dynamic(() => import("@/components/charts/PopulationPyramid"), { ssr: false })

type ChartQuestion = {
  id: string
  question: string
  type: string
  counts: Record<string, number>
  answered: number
}

type ResultsData = {
  totalResponses: number
  questions: ChartQuestion[]
  birthYearCounts?: Record<string, number>
  pyramidData?: { birthYear: string; gender: string }[]
  updatedAt: string
  hasTestData?: boolean
}

const SHARE_URL = "https://p.aicu.jp/q/R2602?utm_source=share&utm_medium=social&utm_campaign=R2602"
const SHARE_TEXT = "生成AI時代の\"つくる人\"調査 R2602 に参加しよう！約5分で完了、10,000 AICUポイント付与"

export default function ResultsClient() {
  const [data, setData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const myAnswers = useMyAnswers("https://j.aicu.ai/R2602")

  useEffect(() => {
    fetch("/api/surveys/R2602/results")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.questions)) setData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Disable right-click
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener("contextmenu", prevent)
    document.addEventListener("copy", prevent)
    document.addEventListener("cut", prevent)
    return () => {
      document.removeEventListener("contextmenu", prevent)
      document.removeEventListener("copy", prevent)
      document.removeEventListener("cut", prevent)
    }
  }, [])

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "R2602 調査", text: SHARE_TEXT, url: SHARE_URL })
        return
      } catch { /* user cancelled or unsupported */ }
    }
    // Fallback: copy to clipboard (temporarily allow)
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT}\n${SHARE_URL}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [])

  // Build renderable items — merge paired bar questions into one card
  const renderItems = buildRenderItems(data)

  return (
    <div style={{
      minHeight: "100dvh", background: "#f8f9fa", color: "#1a1a2e",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Noto Sans JP', sans-serif",
      WebkitUserSelect: "none", userSelect: "none",
    }}>
      {/* Print / copy prevention */}
      <style>{`
        @media print { body { display: none !important; } }
        img { -webkit-user-drag: none; user-drag: none; pointer-events: none; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)",
        padding: "20px 16px", textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: "#41C9B4" }}>AICU</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e" }}>Research</span>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          R2602 調査結果（速報・プレビュー）
        </h1>
        {data && (
          <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
            回答数: {data.totalResponses}件 / 最終更新: {new Date(data.updatedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
          </p>
        )}
      </div>

      {/* Notice */}
      <div style={{
        maxWidth: 720, margin: "16px auto 0", padding: "12px 20px",
        background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 8,
        fontSize: 13, color: "#6D4C00", lineHeight: 1.7,
      }}>
        <p style={{ margin: 0, fontWeight: 600 }}>本データはアンケート参加前のプレビューです</p>
        <p style={{ margin: "4px 0 0" }}>
          アンケート参加後には実データが表示されます。
          {" "}<a href="/q/R2602?utm_source=results&utm_medium=banner&utm_campaign=R2602" style={{ color: "#0031D8", fontWeight: 600 }}>アンケートに参加する</a>
        </p>
      </div>

      {/* My answers indicator */}
      {myAnswers && (
        <div style={{
          maxWidth: 720, margin: "8px auto 0", padding: "8px 20px",
          background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: 8,
          fontSize: 13, color: "#E65100", fontWeight: 600,
        }}>
          ★ あなたの回答がハイライト表示されています
        </div>
      )}

      {/* Share bar */}
      <div style={{ maxWidth: 720, margin: "12px auto 0", textAlign: "center" }}>
        <button
          onClick={handleShare}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 8,
            border: "1px solid rgba(0,49,216,0.2)", background: "#fff",
            color: "#0031D8", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          {copied ? "URL をコピーしました" : "この調査をシェアする"}
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 60px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>読み込み中...</div>
        ) : !data || data.totalResponses === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>回答データがありません</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {renderItems.map((item, idx) => (
              <ChartCard key={item.key} item={item} data={data} myAnswers={myAnswers} qNum={idx + 1} />
            ))}
          </div>
        )}
      </div>

      {/* Metrics explanation */}
      {data && data.totalResponses > 0 && (
        <div style={{
          maxWidth: 720, margin: "0 auto", padding: "0 16px 20px",
          fontSize: 11, color: "#aaa", lineHeight: 1.8,
        }}>
          <p style={{ margin: 0 }}>
            <strong>統計指標について</strong> ― 回答率 = その質問への回答数 ÷ 全回答者数。
            多様性 = Shannon エントロピー H = −Σ p(x) log₂ p(x)。
            値が大きいほど回答が分散（多様）、0に近いほど一択に集中。
            最大値は log₂(選択肢数) で、全選択肢が均等なときに到達します。
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px 16px", fontSize: 12, color: "#bbb", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <a href="/q/R2602" style={{ color: "#0031D8", textDecoration: "none", fontWeight: 600 }}>調査に回答する</a>
        {" / "}
        <a href="/q/R2602/policy" style={{ color: "#888", textDecoration: "none" }}>データ利用方針</a>
        <p style={{ marginTop: 8 }}>&copy; 2026 AICU Japan 株式会社 All rights reserved. 無断複製・転載禁止</p>
      </div>
    </div>
  )
}

// ── Render item types ──

type SingleItem = {
  key: string
  kind: "single"
  vizType: VizType
  question: ChartQuestion
}

type PairedItem = {
  key: string
  kind: "paired"
  vizType: "paired-bar"
  done: ChartQuestion
  want: ChartQuestion
}

type AgePieItem = {
  key: string
  kind: "age-pie"
  vizType: "age-pie"
  question: ChartQuestion
}

type PyramidItem = {
  key: string
  kind: "pyramid"
  vizType: "pyramid"
  genderQ: ChartQuestion
  ageQ: ChartQuestion
}

type RenderItem = SingleItem | PairedItem | AgePieItem | PyramidItem

const GENDER_ID = "entry_1821980007"
const AGE_ID = "entry_170746194"

function buildRenderItems(data: ResultsData | null): RenderItem[] {
  if (!data) return []
  const items: RenderItem[] = []
  const pairedDone = data.questions.find((q) => q.id === PAIRED_BAR_IDS.done)
  const pairedWant = data.questions.find((q) => q.id === PAIRED_BAR_IDS.want)
  const genderQ = data.questions.find((q) => q.id === GENDER_ID)
  const ageQ = data.questions.find((q) => q.id === AGE_ID)
  let pairedInserted = false
  let pyramidInserted = false

  for (const q of data.questions) {
    // Skip the "want" question — it's merged into the paired bar
    if (q.id === PAIRED_BAR_IDS.want) continue

    // Paired bar: merge done + want into one card
    if (q.id === PAIRED_BAR_IDS.done && pairedDone && pairedWant) {
      if (!pairedInserted) {
        items.push({ key: "paired-effect", kind: "paired", vizType: "paired-bar", done: pairedDone, want: pairedWant })
        pairedInserted = true
      }
      continue
    }

    const vizType = VIZ_MAP[q.id] || "horizontal-bar"

    if (vizType === "age-pie") {
      // Insert age-pie first, then pyramid right after
      items.push({ key: q.id, kind: "age-pie", vizType: "age-pie", question: q })
      if (!pyramidInserted && genderQ && ageQ && data.pyramidData?.length) {
        items.push({ key: "pyramid", kind: "pyramid", vizType: "pyramid", genderQ, ageQ })
        pyramidInserted = true
      }
    } else {
      items.push({ key: q.id, kind: "single", vizType, question: q })
    }
  }

  return items
}

// ── Chart card wrapper ──

function ChartCard({ item, data, myAnswers, qNum }: {
  item: RenderItem
  data: ResultsData
  myAnswers: Record<string, unknown> | null
  qNum: number
}) {
  const isSample = !myAnswers

  if (item.kind === "pyramid") {
    const total = data.pyramidData?.length || 0
    const pyramidComment = getPyramidCommentary({ crossData: data.pyramidData || [] })
    return (
      <CardWrapper title={`Q${qNum}. 回答者の年代×性別（人口ピラミッド）`} subtitle={`${total}件の回答`} isSample={isSample}>
        <PopulationPyramid
          birthYearCounts={data.birthYearCounts || {}}
          genderCounts={item.genderQ.counts}
          crossData={data.pyramidData || []}
          answered={total}
        />
        <Commentary text={pyramidComment} />
      </CardWrapper>
    )
  }

  if (item.kind === "paired") {
    const gapItems = computeGapAnalysis(item.done.counts, item.want.counts, item.done.answered, item.want.answered)
    const pairedComment = getPairedBarCommentary({ gapItems, doneAnswered: item.done.answered, wantAnswered: item.want.answered })
    return (
      <CardWrapper
        title={`Q${qNum}. AI利用の効果（実現 vs 期待）`}
        subtitle={`実現: ${item.done.answered}件 / 期待: ${item.want.answered}件の回答（複数選択可）`}
        isSample={isSample}
      >
        <PairedBarChart
          doneCounts={item.done.counts}
          wantCounts={item.want.counts}
          doneAnswered={item.done.answered}
          wantAnswered={item.want.answered}
          myDone={getMyAnswer(myAnswers, PAIRED_BAR_IDS.done)}
          myWant={getMyAnswer(myAnswers, PAIRED_BAR_IDS.want)}
        />
        <Commentary text={pairedComment} />
      </CardWrapper>
    )
  }

  if (item.kind === "age-pie") {
    const q = item.question
    const ageStats = computeStats(q.counts, q.answered, data.totalResponses)
    const ageComment = getQuestionCommentary({
      id: q.id, counts: q.counts, answered: q.answered,
      totalResponses: data.totalResponses, stats: ageStats,
    })
    return (
      <CardWrapper title={`Q${qNum}. ${q.question}`} subtitle={`${q.answered}件の回答`} isSample={isSample}>
        <AgeBucketChart
          birthYearCounts={data.birthYearCounts || {}}
          answered={q.answered}
          myAnswer={getMyAnswer(myAnswers, q.id)}
        />
        <Commentary text={ageComment} />
        <StatsFooter stats={ageStats} />
      </CardWrapper>
    )
  }

  // Single chart
  const q = item.question
  const isMulti = q.type === "multi_choice"
  const my = getMyAnswer(myAnswers, q.id)
  const stats = computeStats(q.counts, q.answered, data.totalResponses)
  const comment = getQuestionCommentary({
    id: q.id, counts: q.counts, answered: q.answered,
    totalResponses: data.totalResponses, stats,
  })

  return (
    <CardWrapper
      title={`Q${qNum}. ${q.question}`}
      subtitle={`${q.answered}件の回答${isMulti ? "（複数選択可）" : ""}`}
      isSample={isSample}
    >
      {item.vizType === "stacked-bar" && (
        <StackedBar counts={q.counts} answered={q.answered} myAnswer={my} />
      )}
      {item.vizType === "donut" && (
        <DonutChart counts={q.counts} answered={q.answered} myAnswer={my} />
      )}
      {item.vizType === "regional-pie" && (
        <RegionalPieChart counts={q.counts} answered={q.answered} myAnswer={my} />
      )}
      {item.vizType === "tag-cloud" && (
        <TagCloud counts={q.counts} answered={q.answered} myAnswer={my} />
      )}
      {item.vizType === "treemap" && (
        <TreemapChart
          counts={q.counts}
          answered={q.answered}
          myAnswer={my}
          maxSelections={10}
          description="参加者に最大10件の使用ツールを列挙させた。全体スコアを参加者×10ポイントとした場合の投票獲得率。"
        />
      )}
      {item.vizType === "horizontal-bar" && (
        <HorizontalBarChart counts={q.counts} answered={q.answered} isMulti={isMulti} myAnswer={my} />
      )}
      <Commentary text={comment} />
      <StatsFooter stats={stats} />
    </CardWrapper>
  )
}

function CardWrapper({ title, subtitle, isSample, children }: {
  title: string
  subtitle: string
  isSample?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "20px 24px",
      border: "1px solid rgba(0,0,0,0.08)", position: "relative",
      overflow: "hidden",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e", margin: "0 0 4px", lineHeight: 1.5 }}>
        {title}
      </h3>
      <p style={{ fontSize: 12, color: "#999", margin: "0 0 16px" }}>
        {subtitle}
      </p>
      {children}
      {/* Watermark — vertically centered */}
      {isSample ? (
        <span style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%) rotate(-20deg)",
          fontSize: 18, color: "rgba(0,0,0,0.2)", fontWeight: 800,
          pointerEvents: "none", userSelect: "none",
          whiteSpace: "nowrap", letterSpacing: "0.02em",
        }}>
          [Sample Data] 調査依頼は r2602@aicu.jp まで
        </span>
      ) : (
        <span style={{
          position: "absolute", top: "50%", right: 12,
          transform: "translateY(-50%)",
          fontSize: 9, color: "rgba(0,0,0,0.2)", fontWeight: 600,
          pointerEvents: "none", userSelect: "none",
        }}>
          p.aicu.jp/R2602
        </span>
      )}
    </div>
  )
}

function Commentary({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div style={{
      marginTop: 12, padding: "10px 14px",
      background: "#f5f6f7", borderLeft: "3px solid #41C9B4",
      borderRadius: "0 6px 6px 0",
      fontSize: 12, lineHeight: 1.8, color: "#444",
    }}>
      {text}
    </div>
  )
}

function StatsFooter({ stats }: { stats: { responseRate: number; mode: string; modePct: number; entropy: number } }) {
  return (
    <div style={{
      marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.05)",
      display: "flex", flexWrap: "wrap", gap: "4px 16px",
      fontSize: 11, color: "#999",
    }}>
      <span>回答率 {stats.responseRate}%</span>
      <span>最多: {stats.mode.length > 15 ? stats.mode.slice(0, 15) + "…" : stats.mode} ({stats.modePct}%)</span>
      <span>多様性 {stats.entropy.toFixed(2)}</span>
    </div>
  )
}

function getMyAnswer(myAnswers: Record<string, unknown> | null, questionId: string): string | string[] | undefined {
  if (!myAnswers) return undefined
  const v = myAnswers[questionId]
  if (v === undefined || v === null) return undefined
  if (Array.isArray(v)) return v.map(String)
  return String(v)
}
