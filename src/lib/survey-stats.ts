/**
 * Survey statistics utilities
 */

export type BasicStats = {
  responseRate: number   // 回答率 (0-100)
  mode: string           // 最頻値
  modeCount: number
  modePct: number
  entropy: number        // Shannon entropy (多様性指数, 0 = 全員同じ回答)
}

export type OrderedStats = BasicStats & {
  meanPosition: number   // 順序尺度の平均位置 (0-indexed)
  stddev: number
}

export type GapItem = {
  label: string
  donePct: number
  wantPct: number
  gap: number  // wantPct - donePct
}

/**
 * Compute basic statistics for a question's response distribution.
 */
export function computeStats(counts: Record<string, number>, answered: number, totalResponses: number): BasicStats {
  const entries = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const mode = entries[0]?.[0] || ""
  const modeCount = entries[0]?.[1] || 0
  const modePct = answered > 0 ? Math.round((modeCount / answered) * 100) : 0
  const responseRate = totalResponses > 0 ? Math.round((answered / totalResponses) * 100) : 0

  // Shannon entropy
  const total = entries.reduce((s, [, v]) => s + v, 0)
  let entropy = 0
  if (total > 0) {
    for (const [, count] of entries) {
      if (count > 0) {
        const p = count / total
        entropy -= p * Math.log2(p)
      }
    }
  }

  return { responseRate, mode, modeCount, modePct, entropy: Math.round(entropy * 100) / 100 }
}

/**
 * Compute statistics for ordered/ordinal scales (e.g., cost ranges).
 * Labels are expected in order from lowest to highest.
 */
export function computeOrderedStats(
  counts: Record<string, number>,
  orderedLabels: string[],
  answered: number,
  totalResponses: number,
): OrderedStats {
  const basic = computeStats(counts, answered, totalResponses)

  // Mean position (weighted average of indices)
  let sumWeighted = 0
  let sumCount = 0
  for (let i = 0; i < orderedLabels.length; i++) {
    const c = counts[orderedLabels[i]] || 0
    sumWeighted += i * c
    sumCount += c
  }
  const meanPosition = sumCount > 0 ? sumWeighted / sumCount : 0

  // Standard deviation
  let sumSqDiff = 0
  for (let i = 0; i < orderedLabels.length; i++) {
    const c = counts[orderedLabels[i]] || 0
    sumSqDiff += c * (i - meanPosition) ** 2
  }
  const stddev = sumCount > 0 ? Math.sqrt(sumSqDiff / sumCount) : 0

  return { ...basic, meanPosition: Math.round(meanPosition * 10) / 10, stddev: Math.round(stddev * 10) / 10 }
}

/**
 * Compute gap analysis between "done" and "want" paired questions.
 */
export function computeGapAnalysis(
  doneCounts: Record<string, number>,
  wantCounts: Record<string, number>,
  doneAnswered: number,
  wantAnswered: number,
): GapItem[] {
  const allLabels = new Set([...Object.keys(doneCounts), ...Object.keys(wantCounts)])
  return Array.from(allLabels).map((label) => {
    const donePct = doneAnswered > 0 ? Math.round(((doneCounts[label] || 0) / doneAnswered) * 100) : 0
    const wantPct = wantAnswered > 0 ? Math.round(((wantCounts[label] || 0) / wantAnswered) * 100) : 0
    return { label, donePct, wantPct, gap: wantPct - donePct }
  }).sort((a, b) => b.gap - a.gap)
}
