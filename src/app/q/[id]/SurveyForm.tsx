"use client"

import LiquidGlassForm from "@/components/LiquidGlassForm"
import type { SurveyConfig } from "@/data/surveys"

type Props = {
  surveyId?: string
  config: SurveyConfig
  email?: string
  birthYear?: string
}

export default function SurveyForm({ surveyId, config, email, birthYear }: Props) {
  return <LiquidGlassForm formConfig={config} initialEmail={email} initialBirthYear={birthYear} surveyLabel={surveyId} />
}
