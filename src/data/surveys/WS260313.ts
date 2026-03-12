import type { SurveyConfig } from "./index"

export const WS260313_CONFIG: SurveyConfig = {
  title: "ワークショップ フィードバック",
  description: "本日のワークショップについてご意見をお聞かせください（1分程度）",
  submitUrl: "/api/surveys/WS260313",
  estimatedMinutes: 1,
  skipGate: true,
  opensAt: "2026-03-12T00:00:00+09:00",
  closesAt: "2026-03-31T23:59:59+09:00",

  questions: [
    // ── ワークショップの評価 ──
    {
      id: "ws_recommend",
      type: "single_choice",
      question: "このワークショップを他の人にもおすすめしたいですか？",
      required: true,
      options: [
        "ぜひおすすめしたい",
        "おすすめしたい",
        "どちらでもない",
        "あまりおすすめしない",
        "おすすめしない",
      ],
    },
    {
      id: "ws_again",
      type: "single_choice",
      question: "またこのようなワークショップに参加したいですか？",
      required: true,
      options: [
        "ぜひ参加したい",
        "参加したい",
        "どちらでもない",
        "あまり参加したくない",
        "参加したくない",
      ],
    },
    {
      id: "ws_challenges",
      type: "textarea",
      question: "今回のワークショップで感じた課題や改善点があれば教えてください。",
      placeholder: "自由にお書きください",
      required: false,
    },
    {
      id: "ws_want_to_know",
      type: "textarea",
      question: "今後、どのようなことを学びたい・知りたいですか？",
      placeholder: "自由にお書きください",
      required: false,
    },

    // ── オプション ──
    {
      id: "section_optional",
      type: "section",
      title: "オプション（任意）",
      description: "以下は任意項目です。お気軽にどうぞ。",
    },
    {
      id: "ws_work_url",
      type: "text",
      question: "今回の作品のURL（SNS投稿、ポートフォリオなど）があればお知らせください。",
      placeholder: "https://...",
      required: false,
    },
    {
      id: "ws_email",
      type: "text",
      question: "今後のご案内をお送りしてもよろしければ、メールアドレスをお知らせください。",
      placeholder: "your@email.com",
      required: false,
    },
  ],
}
