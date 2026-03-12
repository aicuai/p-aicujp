import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { getSurveyConfig, getSurveyConfigWithLang } from "@/data/surveys"
import SurveyGate from "./SurveyGate"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; lang?: string }>
}

// Detect preferred language from Accept-Language header
function detectLang(acceptLanguage: string | null, queryLang?: string): string | undefined {
  if (queryLang) return queryLang
  if (!acceptLanguage) return undefined
  // Parse Accept-Language: "ja,en-US;q=0.9,en;q=0.8" → ["ja", "en"]
  const langs = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().split("-")[0].toLowerCase())
  return langs[0] || undefined
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { id } = await params
  const { lang: queryLang } = await searchParams
  const headersList = await headers()
  const lang = detectLang(headersList.get("accept-language"), queryLang)
  const config = await getSurveyConfigWithLang(id, lang)
  if (!config) return { title: "Not Found" }
  const ogImage = id === "R2602" ? "https://p.aicu.jp/ogp/R2602.png" : undefined
  return {
    title: `${config.title} | AICU Research`,
    description: config.description,
    openGraph: {
      title: `${config.title} | AICU Research`,
      description: config.description ?? "",
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${config.title} | AICU Research`,
      description: config.description ?? "",
      ...(ogImage && { images: [ogImage] }),
    },
  }
}

export default async function SurveyPage({ params, searchParams }: Props) {
  const { id } = await params
  const { email, lang: queryLang } = await searchParams

  // For multilingual surveys, detect language
  const headersList = await headers()
  const lang = detectLang(headersList.get("accept-language"), queryLang)
  const config = await getSurveyConfigWithLang(id, lang)
  if (!config) notFound()

  return <SurveyGate surveyId={id} config={config} email={email} />
}
