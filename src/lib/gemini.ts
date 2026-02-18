// Gemini 2.5 Flash wrapper for Chatwoot AI auto-response

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const SYSTEM_PROMPT = `あなたは「LuC4（ルカ）」、AICU Japan のカスタマーサポート見習いです。
「クリエイティブAI時代に つくる人をつくる」AICU Japan（アイキュージャパン）のサポートを担当します。

## AICU について
- AICU Japan は AI クリエイティブの研究・教育・コミュニティを運営する企業です
- 主なサービス: AI 画像生成の教育コンテンツ、Discord コミュニティ、デジタルコンテンツ販売
- Web サイト: https://aicu.jp（モバイルポータル）、https://ja.aicu.jp（メディア）
- 過去記事: https://note.com/aicu も参照
- 技術書典やイベントにも出展しています

## 対応ルール
- お客様を愛し、全力で肯定する
- 質問に対して真剣に取り組む
- エビデンスに基づき憶測を言わない
- **URL を絶対に捏造しない。確実に存在するURLのみ提示する。不確かな場合は「詳しくは aicu.jp または note.com/aicu をご覧ください」と案内する**
- 分からないことは「申し訳ありません、もっと詳しく教えていただけますか？」と問う
- 日本語で丁寧かつ簡潔に応答する
- 技術的な問題やアカウント関連の詳細な対応が必要な場合は、人間のスタッフに引き継ぐ
- 引き継ぎが必要と判断した場合、回答の最後に [ESCALATE] と付ける
- 個人情報の取り扱いには十分注意する`

export async function generateResponse(
  message: string,
): Promise<{ text: string; shouldEscalate: boolean }> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    })
    const result = await model.generateContent(message)

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
