/**
 * Survey commentary — ルールベース・コメンタリー生成
 * 設問ごとに統計データ（最頻値, %, エントロピー等）を参照した分析テキストを動的生成。
 */

import type { GapItem } from "./survey-stats"

// ── Types ──

export type CommentaryInput = {
  id: string
  counts: Record<string, number>
  answered: number
  totalResponses: number
  stats: { responseRate: number; mode: string; modePct: number; entropy: number }
}

export type PairedCommentaryInput = {
  gapItems: GapItem[]
  doneAnswered: number
  wantAnswered: number
}

export type PyramidCommentaryInput = {
  crossData: { birthYear: string; gender: string }[]
}

// ── Helpers ──

/** 上位N件を { label, count, pct }[] で返す */
function topN(counts: Record<string, number>, answered: number, n: number) {
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({
      label,
      count,
      pct: answered > 0 ? Math.round((count / answered) * 100 * 10) / 10 : 0,
    }))
}

/** エントロピーに基づく分散レベル */
function entropyLevel(entropy: number, optionCount: number): "concentrated" | "moderate" | "diverse" {
  const maxEntropy = Math.log2(optionCount)
  if (maxEntropy === 0) return "concentrated"
  const ratio = entropy / maxEntropy
  if (ratio < 0.5) return "concentrated"
  if (ratio < 0.75) return "moderate"
  return "diverse"
}

/** 回答率に基づく注釈（低い場合のみ） */
function responseRateNote(rate: number): string {
  if (rate < 70) return `回答率${rate}%とスキップ率が高く、回答者の関与度に差がある設問。`
  return ""
}

/** パーセンテージ表示 */
function pct(v: number): string {
  return `${Math.round(v * 10) / 10}%`
}

/** 上位の列挙テキスト */
function listTop(items: { label: string; pct: number }[], n: number): string {
  return items.slice(0, n).map((i) => `「${i.label}」${pct(i.pct)}`).join("、")
}

// ── Commentary templates ──

type TemplateFunc = (input: CommentaryInput) => string

const TEMPLATES: Record<string, TemplateFunc> = {

  // 年齢（age-pie — counts はバケット化済みとして扱わない。ここではstatsのmode等を活用）
  entry_170746194: ({ stats }) => {
    const context = "年齢分布は回答者コミュニティの世代構成を示す。"
    const insight = `最多は${stats.mode}で${pct(stats.modePct)}を占める。`
    const level = entropyLevel(stats.entropy, 6)
    const pi = level === "diverse"
      ? "幅広い年齢層がAIに関わっており、世代を超えた関心の高さがうかがえる。"
      : level === "concentrated"
        ? "特定の世代に回答者が集中しており、AIの普及が世代限定的である可能性がある。"
        : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // 性別
  entry_1821980007: ({ stats, counts, answered }) => {
    const top = topN(counts, answered, 3)
    const context = "生成AIは自然言語インタフェースで操作できるため、従来のプログラミングツールよりもジェンダーギャップ縮小の可能性がある。"
    const insight = top.length >= 2
      ? `${top.map((t) => `「${t.label}」${pct(t.pct)}`).join("、")}という構成。`
      : `「${stats.mode}」が${pct(stats.modePct)}で最多。`
    return context + insight
  },

  // 職業
  entry_1957471882: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "職業構成はAI活用の動機や方向性を左右する。"
    const insight = `${listTop(top3, 3)}が上位を占める。`
    const freelance = counts["フリーランス / 自営業"] || counts["フリーランス"] || 0
    const freelancePct = answered > 0 ? Math.round((freelance / answered) * 100) : 0
    const pi = freelancePct >= 20
      ? `フリーランス比率${freelancePct}%は、AI活用による個人の生産性向上が独立した働き方を支えている可能性を示す。`
      : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // 地域
  entry_1357554301: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "地域分布はAI活用の地理的偏在を反映する。"
    const insight = `${listTop(top3, 3)}が上位。`
    const kanto = counts["関東"] || 0
    const kantoPct = answered > 0 ? Math.round((kanto / answered) * 100) : 0
    const pi = kantoPct >= 40
      ? `関東圏が${kantoPct}%と首都圏集中が顕著だが、リモートワークの浸透によりAI活用は全国に広がりうる。`
      : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // AI関係性
  entry_1228619554: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "「自分とAIの関係」の自認は、活用の深度と方向性を示す指標となる。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多、次いで${listTop(top3.slice(1, 3), 2)}。`
    return context + insight
  },

  // セクター
  entry_885269464: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "活動セクターは、AI利用の文脈（個人活動 vs 組織内）を反映する。"
    const insight = `${listTop(top3, 3)}が上位。`
    const level = entropyLevel(stats.entropy, Object.keys(counts).length)
    const pi = level === "diverse" ? "多様なセクターからの回答があり、AIの浸透が業界横断的であることを示す。" : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // AI領域（複数選択）
  entry_2077750738: ({ counts, answered }) => {
    const top5 = topN(counts, answered, 5)
    const context = "関わっている生成AI領域は、技術の実用化段階を反映する。"
    const insight = `${listTop(top5, 3)}が上位を占める。`
    const video = counts["動画生成"] || counts["動画"] || 0
    const videoPct = answered > 0 ? Math.round((video / answered) * 100) : 0
    const pi = videoPct >= 15
      ? `動画生成が${videoPct}%と、テキスト・画像に続く第三の波として台頭しつつある。`
      : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // 有償実績
  entry_35926345: ({ stats, counts, answered }) => {
    const top = topN(counts, answered, 4)
    const context = "AI活用の収益化実態は、市場成熟度の重要な指標。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。`
    const noRevenue = counts["ない"] || counts["なし"] || counts["まだない"] || 0
    const noRevPct = answered > 0 ? Math.round((noRevenue / answered) * 100) : 0
    const pi = noRevPct >= 40
      ? `未収益層が${noRevPct}%を占め、収益化の二極化が見られる。AI活用スキルから収益への転換が今後の課題。`
      : top.length >= 2
        ? `${listTop(top.slice(0, 2), 2)}が主な分布。`
        : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // 売上帯
  entry_274138831: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "AI関連の年間売上規模は、個人・組織のビジネス成熟度を示す。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。${listTop(top3.slice(1, 3), 2)}が続く。`
    const rateNote = responseRateNote(stats.responseRate)
    return [context, insight, rateNote].filter(Boolean).join("")
  },

  // AI月額費用
  entry_1024046675: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "AIツールへの月額投資額は、プロフェッショナル利用の指標となる。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。${listTop(top3.slice(1, 3), 2)}が続く。`
    const free = counts["0円（無料のみ）"] || counts["0円"] || counts["無料"] || 0
    const freePct = answered > 0 ? Math.round((free / answered) * 100) : 0
    const pi = freePct >= 30
      ? `無料のみの利用者が${freePct}%存在し、無料ティアの充実がAI普及の鍵であることを示す。`
      : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // 学習投資
  entry_998532907: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "AI学習への投資額は、自己研鑽の意欲とアクセシビリティを反映する。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。`
    const free = counts["0円（独学・無料リソースのみ）"] || counts["0円"] || counts["独学"] || 0
    const freePct = answered > 0 ? Math.round((free / answered) * 100) : 0
    const pi = freePct >= 30
      ? `独学・無料リソースのみが${freePct}%と、情報の民主化が進んでいることを示す。`
      : `${listTop(top3, 3)}に分布。`
    return [context, insight, pi].filter(Boolean).join("")
  },

  // 学習方法
  entry_2000848438: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "学習方法の選択は、AIリテラシーの獲得経路を可視化する。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多、${listTop(top3.slice(1, 3), 2)}が続く。`
    const level = entropyLevel(stats.entropy, Object.keys(counts).length)
    const pi = level === "diverse"
      ? "学習方法が多様に分散しており、画一的でない知識獲得が進んでいる。"
      : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // OS/ハード
  entry_1829344839: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "利用OS・ハードウェアは、作業環境と計算資源の選択を反映する。"
    const insight = `${listTop(top3, 3)}が上位。`
    const win = counts["Windows"] || 0
    const mac = counts["Mac / macOS"] || counts["Mac"] || counts["macOS"] || 0
    if (win > 0 && mac > 0) {
      const winPct = answered > 0 ? Math.round((win / answered) * 100) : 0
      const macPct = answered > 0 ? Math.round((mac / answered) * 100) : 0
      const pi = `Windows ${winPct}% vs Mac ${macPct}%。クリエイティブ領域ではMac比率が一般平均より高い傾向がある。`
      return context + insight + pi
    }
    return context + insight
  },

  // GPU
  entry_505387619: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "GPU環境はローカルAI実行能力の指標となる。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。${listTop(top3.slice(1, 3), 2)}が続く。`
    const noGpu = counts["GPUなし / 内蔵のみ"] || counts["GPUなし"] || counts["なし"] || 0
    const noGpuPct = answered > 0 ? Math.round((noGpu / answered) * 100) : 0
    const pi = noGpuPct >= 30
      ? `GPU非搭載が${noGpuPct}%を占め、クラウドAPI依存の利用形態が主流であることを示唆する。`
      : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // ツール（treemap）
  entry_1878680578: ({ counts, answered }) => {
    const top5 = topN(counts, answered, 5)
    const context = "使用ツールの分布は、AI市場のプラットフォーム競争を可視化する。"
    const insight = `${listTop(top5, 3)}が上位。`
    const chatgpt = counts["ChatGPT"] || 0
    const chatgptPct = answered > 0 ? Math.round((chatgpt / answered) * 100) : 0
    const pi = chatgptPct >= 50
      ? `ChatGPTが${chatgptPct}%と圧倒的なシェアを持つ一方、専門ツールの台頭も見られる。`
      : chatgptPct >= 30
        ? `ChatGPTが${chatgptPct}%でリードするが、ツールの多様化が進んでいる。`
        : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // AI態度
  entry_34298640: ({ stats, counts, answered }) => {
    const context = "AIに対する態度は、今後の普及速度を左右する社会的指標。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。`
    const essential = counts["なくてはならない（必須）"] || counts["必須"] || counts["なくてはならない"] || 0
    const essentialPct = answered > 0 ? Math.round((essential / answered) * 100) : 0
    const pi = essentialPct >= 50
      ? `「必須」が過半数の${essentialPct}%を超え、AIがすでにインフラ化していることを示す。`
      : essentialPct >= 30
        ? `「必須」が${essentialPct}%と、AIへの依存度の高さがうかがえる。`
        : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // ボトルネック（複数選択）
  entry_537892144: ({ counts, answered }) => {
    const top5 = topN(counts, answered, 5)
    const context = "AI活用のボトルネックは、普及の阻害要因と政策課題を示す。"
    const insight = `${listTop(top5, 3)}が上位に挙がった。`
    const cost = counts["コスト（サブスクリプション費用等）"] || counts["コスト"] || 0
    const copyright = counts["著作権・法律の不透明さ"] || counts["著作権"] || 0
    const costPct = answered > 0 ? Math.round((cost / answered) * 100) : 0
    const copyrightPct = answered > 0 ? Math.round((copyright / answered) * 100) : 0
    const pi = costPct >= 20 && copyrightPct >= 20
      ? `コスト(${costPct}%)と著作権(${copyrightPct}%)が二大障壁として認識されている。`
      : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // 証明価値（複数選択）
  entry_722928489: ({ counts, answered }) => {
    const top5 = topN(counts, answered, 5)
    const context = "AI活用の証明として何が価値を持つかは、信頼構築の方向性を示す。"
    const insight = `${listTop(top5, 3)}が上位。`
    const ethics = counts["AIの倫理的利用に関する知識"] || counts["倫理"] || 0
    const ethicsPct = answered > 0 ? Math.round((ethics / answered) * 100) : 0
    const pi = ethicsPct >= 20
      ? `倫理的利用の知識が${ethicsPct}%と、技術力だけでなく倫理観も重視される傾向。`
      : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // 公開プラットフォーム（複数選択）
  entry_333973041: ({ counts, answered }) => {
    const top5 = topN(counts, answered, 5)
    const context = "作品公開プラットフォームは、クリエイターの発表スタイルと市場接点を反映する。"
    const insight = `${listTop(top5, 3)}が上位。`
    const level = entropyLevel(
      // approximate — use rough calculation from top items
      -top5.reduce((s, i) => { const p = i.pct / 100; return p > 0 ? s + p * Math.log2(p) : s }, 0),
      Object.keys(counts).length,
    )
    const pi = level === "diverse"
      ? "プラットフォームが多様に分散しており、SNS主導の多チャネル発表が常態化している。"
      : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // 二次創作
  entry_448099795: ({ stats }) => {
    const context = "AI生成作品の二次創作条件に対する態度は、著作権意識の現在地を示す。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。`
    return context + insight
  },

  // 著作権
  entry_454206106: ({ stats }) => {
    const context = "AIと著作権に関する見解は、法整備の方向性を占う重要な指標。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。`
    const level = entropyLevel(stats.entropy, 3)
    const pi = level === "concentrated"
      ? "意見が特定の立場に集中しており、世論の方向性が比較的明確。"
      : level === "diverse"
        ? "意見が割れており、合意形成がまだ途上であることを示す。"
        : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  // AI関与
  entry_217192455: ({ stats }) => {
    const context = "AI関与度は制作プロセスにおけるAI依存の深さを示す。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。`
    return context + insight
  },

  // インタビュー協力
  entry_1667631330: ({ stats }) => {
    const context = "インタビュー協力の意向は、コミュニティのエンゲージメント深度を測る。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}。`
    return context + insight
  },

  // 教育サービス
  entry_282284746: ({ stats }) => {
    const context = "AI教育サービスへの態度は、リスキリング市場のポテンシャルを示す。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。`
    return context + insight
  },

  // 証明書
  entry_1533319614: ({ stats }) => {
    const context = "AI関連の証明書・資格への関心は、スキル可視化の需要を反映する。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。`
    return context + insight
  },

  // 非利用理由
  entry_953637123: ({ stats, counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "AI非利用の理由は、普及のボトルネックを別角度から照射する。"
    const insight = `${listTop(top3, 3)}が主な理由として挙がった。`
    return context + insight
  },

  // ── DCAJ系 ──

  dcaj_Q1: ({ counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "制作ワークフローへのAI導入状況は、クリエイティブ産業の変革度合いを示す。"
    const insight = `${listTop(top3, 3)}が上位。`
    return context + insight
  },

  dcaj_Q2: ({ stats }) => {
    const context = "AI生成物のオリジナリティに関する認識は、著作権議論の前提となる。"
    const insight = `「${stats.mode}」が${pct(stats.modePct)}で最多。`
    return context + insight
  },

  dcaj_Q3: ({ counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "学習データに対する態度は、AIの倫理的基盤に関する世論を反映する。"
    const insight = `${listTop(top3, 3)}が上位の関心事項。`
    return context + insight
  },

  dcaj_Q4: ({ counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "AIによる仕事の変化は、労働市場への影響認識を示す。"
    const insight = `${listTop(top3, 3)}が上位に挙がった。`
    return context + insight
  },

  dcaj_Q5: ({ counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "AI利用における倫理的懸念は、規制やガイドラインの方向性を示唆する。"
    const insight = `${listTop(top3, 3)}が主要な懸念として認識されている。`
    return context + insight
  },

  dcaj_Q6: ({ counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "AI関連の法制度に対する評価は、政策立案への示唆を含む。"
    const insight = `${listTop(top3, 3)}が注目されている。`
    return context + insight
  },

  dcaj_Q7: ({ counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "AI時代のクリエイター価値は、人間の創造性がどこに残るかを示す。"
    const insight = `${listTop(top3, 3)}が上位に位置する。`
    const level = entropyLevel(
      -topN(counts, answered, 13).reduce((s, i) => { const p = i.pct / 100; return p > 0 ? s + p * Math.log2(p) : s }, 0),
      Object.keys(counts).length,
    )
    const pi = level === "diverse"
      ? "価値の分散が大きく、クリエイター価値が多元的に捉えられている。"
      : ""
    return [context, insight, pi].filter(Boolean).join("")
  },

  dcaj_Q8: ({ counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "国に期待するAI支援は、クリエイターが求める政策の優先順位を示す。"
    const insight = `${listTop(top3, 3)}が求められている。`
    return context + insight
  },

  dcaj_Q9: ({ counts, answered }) => {
    const top3 = topN(counts, answered, 3)
    const context = "海外展開への関心は、AI活用のグローバル志向を示す。"
    const insight = `${listTop(top3, 3)}が上位。`
    return context + insight
  },
}

// ── Public API ──

/** 設問IDに対応するコメンタリーを生成。対応なしの場合は null */
export function getQuestionCommentary(input: CommentaryInput): string | null {
  const template = TEMPLATES[input.id]
  if (!template) return null
  try {
    return template(input)
  } catch {
    return null
  }
}

/** paired-bar（効果対比）専用コメンタリー */
export function getPairedBarCommentary(input: PairedCommentaryInput): string | null {
  const { gapItems } = input
  if (gapItems.length === 0) return null

  const context = "「実現した効果」と「今後期待する効果」のギャップは、AI活用の伸びしろを示す。"

  // 最もギャップが大きい項目（期待 > 実現）
  const topGap = gapItems.filter((g) => g.gap > 0).slice(0, 2)
  // 最もギャップが小さい（実現 ≧ 期待）= すでに実現している項目
  const realized = gapItems.filter((g) => g.gap <= 0).sort((a, b) => a.gap - b.gap).slice(0, 1)

  let insight = ""
  if (topGap.length > 0) {
    insight += topGap.map((g) =>
      `「${g.label}」は期待${g.wantPct}%に対し実現${g.donePct}%でギャップが大きい`
    ).join("。") + "。"
  }
  if (realized.length > 0 && realized[0].donePct > 0) {
    insight += `一方「${realized[0].label}」は実現${realized[0].donePct}%で期待を上回り、すでに成果が出ている領域。`
  }

  return insight ? context + insight : context
}

/** pyramid（年代×性別）専用コメンタリー */
export function getPyramidCommentary(input: PyramidCommentaryInput): string | null {
  const { crossData } = input
  if (crossData.length === 0) return null

  const context = "年代×性別のクロス集計は、回答者コミュニティの人口構成を立体的に示す。"

  // 年代バケットを計算
  const bucketGender: Record<string, Record<string, number>> = {}
  for (const d of crossData) {
    const year = parseInt(d.birthYear, 10)
    if (isNaN(year)) continue
    const age = 2026 - year
    let bucket: string
    if (age < 20) bucket = "〜19歳"
    else if (age < 30) bucket = "20代"
    else if (age < 40) bucket = "30代"
    else if (age < 50) bucket = "40代"
    else if (age < 60) bucket = "50代"
    else bucket = "60歳以上"

    if (!bucketGender[bucket]) bucketGender[bucket] = {}
    bucketGender[bucket][d.gender] = (bucketGender[bucket][d.gender] || 0) + 1
  }

  // 最多の世代×性別セル
  let maxBucket = ""
  let maxGender = ""
  let maxCount = 0
  for (const [bucket, genders] of Object.entries(bucketGender)) {
    for (const [gender, count] of Object.entries(genders)) {
      if (count > maxCount) {
        maxCount = count
        maxBucket = bucket
        maxGender = gender
        }
    }
  }

  const total = crossData.length
  const maxPct = total > 0 ? Math.round((maxCount / total) * 100) : 0

  const insight = maxBucket
    ? `${maxBucket}の${maxGender}が${maxPct}%で最多セグメント。`
    : ""

  return insight ? context + insight : context
}
