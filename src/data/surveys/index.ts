export type SkipCondition = {
  questionId: string
  equals?: string
  notEquals?: string
}

// Declarative derive modes for virtualEntries (must be serializable — no functions)
export type VirtualEntryDerive =
  | "copy"    // copy answer as-is
  | "first"   // take first element of array answer
  | { ifIncludes: string; value: string }  // if answer array includes label, return [value]

// Declarative split config for merged questions (API submission)
export type MergedQuestionSplit = {
  questionId: string  // the merged question's id
  splits: { answerId: string; options: string[] }[]  // split answer into multiple keys by option membership
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
  virtualEntries?: { entryId: number; derive: VirtualEntryDerive }[]  // derive additional Google Form entries
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
  opensAt?: string   // ISO 8601 — survey closed before this time
  closesAt?: string  // ISO 8601 — survey closed after this time
  questions: SurveyQuestion[]
  mergedQuestions?: MergedQuestionSplit[]  // split merged answers for API submission
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
