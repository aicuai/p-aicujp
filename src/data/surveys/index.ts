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
  maxSelections?: number     // max selections for multi_choice (0 = unlimited)
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
  skipGate?: boolean  // skip consent gate (for closed/workshop surveys)
  availableLangs?: string[]  // available language codes (for multilingual surveys)
  currentLang?: string       // current language code
  questions: SurveyQuestion[]
  mergedQuestions?: MergedQuestionSplit[]  // split merged answers for API submission
}

// Registry of all surveys
const registry: Record<string, () => Promise<SurveyConfig>> = {
  R2602: () => import("./R2602").then((m) => m.R2602_CONFIG),
  R2603: () => import("./R2603").then((m) => m.R2603_CONFIG),
  WS260313: () => import("./WS260313").then((m) => m.WS260313_CONFIG),
}

// Language-aware config loader (for multilingual surveys)
export async function getSurveyConfigWithLang(id: string, lang?: string): Promise<SurveyConfig | null> {
  if (id === "R2603" && lang) {
    const { getR2603Config, R2603_LANGS } = await import("./R2603")
    type R2603Lang = typeof R2603_LANGS[number]
    const validLang = R2603_LANGS.includes(lang as R2603Lang) ? (lang as R2603Lang) : "ja"
    return getR2603Config(validLang)
  }
  return getSurveyConfig(id)
}

export function getSurveyConfig(id: string): Promise<SurveyConfig> | null {
  const loader = registry[id]
  if (!loader) return null
  return loader()
}

// All known survey IDs (for status checks)
export const ALL_SURVEY_IDS = ["R2511", "R2602", "R2603", "WS260313"]
