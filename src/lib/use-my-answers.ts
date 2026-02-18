"use client"

import { useState, useEffect } from "react"

// Question IDs that contain personal information — NEVER expose to UI
const PII_FIELDS = new Set([
  "entry_1243761143", // email
  "entry_1127213393", // consent
  "entry_388832134",  // VoC textarea (may contain personal info)
  "entry_1784426158", // VoC textarea
  "entry_611811208",  // VoC textarea
  "dcaj_Q1a",         // textarea
  "dcaj_Q5a",         // textarea
])

/**
 * Custom hook to retrieve user's own survey answers from localStorage.
 * Checks both in-progress and completed answer stores.
 * Strips personal information fields (email, free-text) before returning.
 *
 * Security notes:
 * - Data is local-only (never sent to server or other users)
 * - PII fields are filtered out before any rendering
 * - No cross-user data leakage possible (localStorage is origin-scoped)
 *
 * @param surveyId - The survey source URL used as localStorage key
 * @returns Sanitized answers object or null if not found
 */
export function useMyAnswers(surveyId: string): Record<string, unknown> | null {
  const [answers, setAnswers] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    try {
      // 1. Check completed answers first (persisted after submission)
      const completed = localStorage.getItem(`lgf_completed_${surveyId}`)
      if (completed) {
        const parsed = JSON.parse(completed)
        if (parsed?.answers && typeof parsed.answers === "object") {
          setAnswers(sanitize(parsed.answers))
          return
        }
      }

      // 2. Check in-progress answers (during survey)
      const inProgress = localStorage.getItem(`lgf_${surveyId}`)
      if (inProgress) {
        const parsed = JSON.parse(inProgress)
        if (parsed?.answers && typeof parsed.answers === "object") {
          setAnswers(sanitize(parsed.answers))
          return
        }
      }
    } catch {
      // localStorage not available or parse error
    }

    setAnswers(null)
  }, [surveyId])

  return answers
}

/** Remove PII fields from answers before exposing to UI */
function sanitize(answers: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(answers)) {
    if (PII_FIELDS.has(key)) continue
    safe[key] = value
  }
  return safe
}
