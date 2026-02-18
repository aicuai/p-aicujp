"use client"

import { useState, useEffect } from "react"

/**
 * Custom hook to retrieve user's own survey answers from localStorage.
 * Checks both in-progress and completed answer stores.
 *
 * @param surveyId - The survey source URL used as localStorage key (e.g. "https://j.aicu.ai/R2602")
 * @returns The answers object or null if not found
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
          setAnswers(parsed.answers)
          return
        }
      }

      // 2. Check in-progress answers (during survey)
      const inProgress = localStorage.getItem(`lgf_${surveyId}`)
      if (inProgress) {
        const parsed = JSON.parse(inProgress)
        if (parsed?.answers && typeof parsed.answers === "object") {
          setAnswers(parsed.answers)
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
