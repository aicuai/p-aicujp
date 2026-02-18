export type SkipCondition = {
  questionId: string
  equals?: string
  notEquals?: string
}

export type SurveyQuestion = {
  id: string
  type: "section" | "text" | "textarea" | "single_choice" | "multi_choice" | "dropdown"
  title?: string        // section only
  description?: string  // section only
  question?: string     // non-section
  placeholder?: string
  required?: boolean
  options?: string[]
  popularOptions?: string[]  // shown as quick-select buttons before search
  entryId?: number      // Google Form entry ID
  skipIf?: SkipCondition  // conditional skip (section skipIf cascades to child questions)
  autoAnswer?: boolean  // auto-skip if pre-filled value exists in answers
  virtualEntries?: { entryId: number; deriveFrom: (answer: unknown) => unknown }[]  // derive additional Google Form entries from this answer
}

export type SurveyConfig = {
  title: string
  description?: string
  sourceUrl?: string
  resolvedUrl?: string
  submitToGoogleForm?: boolean
  submitUrl?: string
  reward?: string
  estimatedMinutes?: number
  questions: SurveyQuestion[]
  deriveAnswers?: (answers: Record<string, unknown>) => Record<string, unknown>  // derive additional API answer keys from combined answers
}

// Registry of all surveys
const registry: Record<string, () => Promise<SurveyConfig>> = {
  R2602: () => import("./R2602").then((m) => m.R2602_CONFIG),
}

export function getSurveyConfig(id: string): Promise<SurveyConfig> | null {
  const loader = registry[id]
  if (!loader) return null
  return loader()
}

// All known survey IDs (for status checks)
export const ALL_SURVEY_IDS = ["R2511", "R2602"]
