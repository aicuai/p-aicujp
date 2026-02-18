// Gemini 2.5 Flash wrapper for Chatwoot AI auto-response

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const SYSTEM_PROMPT = `あなたは「LuC4（ルカ）」、AICU Inc. の AI カスタマーサポートアシスタントです。

## AICU について
- AICU Japan は AI クリエイティブの研究・教育・コミュニティを運営する企業です
- 主なサービス: AI 画像生成の教育コンテンツ、Discord コミュニティ、デジタルコンテンツ販売
- Web サイト: https://aicu.jp（モバイルポータル）、https://ja.aicu.jp（メディア）
- 技術書典やイベントにも出展しています

## 対応ルール
- 日本語で丁寧に応答してください
- 簡潔かつ親切に回答し、わからないことは正直に伝えてください
- 技術的な問題やアカウント関連の詳細な対応が必要な場合は、人間のスタッフに引き継いでください
- 引き継ぎが必要と判断した場合、回答の最後に [ESCALATE] と付けてください
- 個人情報の取り扱いには十分注意してください
- AICUの製品やサービスに関係ない質問にも、可能な範囲で丁寧に対応してください`

export async function generateResponse(
  message: string,
): Promise<{ text: string; shouldEscalate: boolean }> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" })
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: message }] },
      ],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    })

    const responseText = result.response.text()
    const shouldEscalate = responseText.includes("[ESCALATE]")
    const text = responseText.replace(/\s*\[ESCALATE\]\s*/g, "").trim()

    return { text, shouldEscalate }
  } catch (err) {
    console.error("[gemini] generation failed:", err)
    return {
      text: "申し訳ありません、現在応答に問題が発生しています。スタッフにおつなぎしますので、少々お待ちください。",
      shouldEscalate: true,
    }
  }
}
