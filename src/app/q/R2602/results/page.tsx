import type { Metadata } from "next"
import ResultsClient from "./ResultsClient"

export const metadata: Metadata = {
  title: "R2602 調査結果（速報） | AICU Research",
}

export default function ResultsPage() {
  return <ResultsClient />
}
