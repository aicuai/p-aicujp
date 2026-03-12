import type { SurveyConfig, SurveyQuestion } from "./index"

// ── Supported languages ──
export type R2603Lang = "ja" | "ko" | "en" | "zh" | "fr" | "es"
export const R2603_LANGS: R2603Lang[] = ["ja", "ko", "en", "zh", "fr", "es"]

// ── Country list (ISO) ──
const COUNTRIES_EN = [
  "Japan", "South Korea", "United States", "China", "Taiwan",
  "France", "Spain", "Germany", "United Kingdom", "Canada",
  "Australia", "Brazil", "Mexico", "India", "Indonesia",
  "Thailand", "Vietnam", "Philippines", "Singapore", "Malaysia",
  "Italy", "Netherlands", "Sweden", "Switzerland", "Other",
]

const JP_PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
]

// ── Tool list (Top 10 as popular, full list as options) ──
const TOOL_POPULAR = [
  "ChatGPT", "ComfyUI", "Midjourney", "Stable Diffusion", "Google Gemini",
  "Claude", "DALL·E", "Sora", "Runway", "Codex",
]

const TOOL_OPTIONS = [
  "A1111", "Adobe Creative Cloud", "Adobe Photoshop", "Adobe Premiere",
  "Adobe After Effects", "AICU.jp", "CapCut", "ChatGPT", "Civitai", "Claude",
  "Codex", "CoeFont", "ComfyUI", "DALL·E", "DaVinci Resolve", "Dreamina",
  "ElevenLabs", "Final Cut Pro", "Flux", "freepik",
  "GitHub Copilot", "Google Gemini", "Google ImageFX", "Google Veo3",
  "Hailuo (MiniMax)", "HuggingFace", "Kling", "krea.ai",
  "Leonardo.ai", "Midjourney", "n8n", "NijiJourney", "Perplexity",
  "Sora", "Stable Diffusion", "Stability AI", "Suno",
  "RunPod", "Runway", "Topaz Video AI", "Udio", "Wan.video",
]

// ── i18n type ──
type I18nStrings = {
  title: string
  description: string
  // Questions — keyed by question ID
  q: Record<string, {
    question: string
    options?: string[]
    placeholder?: string
    title?: string       // for section type
    description?: string // for section type
  }>
}

// ── Japanese (base language) ──
const ja: I18nStrings = {
  title: "生成AI × クリエイティブ 国際調査 2026.03",
  description: "AI時代のクリエイティブ分野における地域性と言語の価値を探る国際調査",
  q: {
    // ── AIとの関わり方 ──
    q_involvement: {
      question: "この1年間に、生成AIとどのような形で関与しましたか？",
      options: [
        "AIによるクリエイティブ制作",
        "AIによる仕事への活用",
        "AIコンテンツの鑑賞・購入",
        "全く関わっていない",
        "その他",
      ],
    },

    // ── 基本情報 ──
    section_basic: { title: "あなたの基本情報", question: "" },
    q_birth_year: {
      question: "生まれた年を西暦でお答えください",
      placeholder: "例: 1990",
    },
    q_gender: {
      question: "あなたの性別を教えてください。",
      options: ["男性", "女性", "ノンバイナリー", "回答しない"],
    },
    q_occupation: {
      question: "現在の職業を教えてください。",
      options: [
        "フリーランス・個人事業主", "学生", "会社員(非クリエイティブ)",
        "会社員(クリエイティブ/製作系)", "公務員", "会社経営",
        "団体職員", "主婦・主夫", "無職・休職中", "その他",
      ],
    },
    q_country: {
      question: "お住まいの国を教えてください。",
    },
    q_prefecture: {
      question: "お住まいの都道府県を教えてください。",
    },

    // ── 分野との関係（新規） ──
    section_fields: { title: "クリエイティブ分野との関係", question: "" },
    q_field_anime: {
      question: "アニメ分野とのあなたの関係は？",
      options: ["産業に従事している", "消費者・ファンとして関わっている", "興味がない"],
    },
    q_field_manga: {
      question: "漫画・コミック分野とのあなたの関係は？",
      options: ["産業に従事している", "消費者・ファンとして関わっている", "興味がない"],
    },
    q_field_game: {
      question: "ゲーム分野とのあなたの関係は？",
      options: ["産業に従事している", "消費者・ファンとして関わっている", "興味がない"],
    },
    q_field_comm: {
      question: "コミュニケーション（SNS・配信・VTuber等）分野とのあなたの関係は？",
      options: ["産業に従事している", "消費者・ファンとして関わっている", "興味がない"],
    },

    // ── 地域性と言語の価値（新規） ──
    section_value: { title: "AI時代の地域性と言語", question: "" },
    q_regional_value: {
      question: "AI時代において、アニメ・漫画・ゲーム・コミュニケーション分野の「地域性」（文化的背景、ローカルな表現）は価値を持つと思いますか？",
      options: ["強くそう思う", "そう思う", "どちらでもない", "そう思わない", "全くそう思わない"],
    },
    q_language_value: {
      question: "AI時代において、これらの分野での「言語」（母語・地域言語での表現）は価値を持つと思いますか？",
      options: ["強くそう思う", "そう思う", "どちらでもない", "そう思わない", "全くそう思わない"],
    },

    // ── AI利用（AI利用者のみ） ──
    section_ai_usage: { title: "AI利用の実態", question: "" },
    q_ai_domains: {
      question: "使用している・関わっている生成AIの領域（複数選択可）",
      options: [
        "画像生成", "音楽生成", "テキスト生成",
        "動画生成", "コーディング支援", "使用していないが興味がある",
      ],
    },
    q_ai_cost: {
      question: "月額のAIツール・サブスク利用料の合計は？",
      options: [
        "0円（無料の範囲）", "月1,000円未満", "月1,000〜5,000円",
        "月5,000〜10,000円", "月10,000〜30,000円", "月30,000円以上",
      ],
    },
    q_tools: {
      question: "使用しているツール・サービスを選んでください（最大10件）",
    },

    // ── 態度 ──
    section_attitude: { title: "態度と課題", question: "" },
    q_ai_stance: {
      question: "AI利用に対するあなたの現在の態度に最も近いものは？",
      options: [
        "AIがなければ仕事・制作は成り立たない",
        "AIは不可欠だが、他の方法でも代替可能",
        "AIは便利だが、従来のやり方でも対応可能",
        "AIはまだ自分には不要",
        "AIには懐疑的・不安を感じている",
      ],
    },
    q_bottleneck: {
      question: "AIの利用におけるボトルネックを最大3つまで選択してください。",
      options: [
        "技術的な難しさ", "利用コストの高さ", "進化が速すぎる",
        "情報の不足", "著作権・倫理上の問題", "成果物のクオリティ",
        "周囲の理解が得られない", "日本語対応や文化的能力の弱さ",
        "法規制・ガイドラインの不明確さ", "その他",
      ],
    },

    // ── DCAJ（著作権・国際） ──
    section_rights: { title: "著作権と国際展開", question: "" },
    q_copyright_responsibility: {
      question: "AIツールの著作権について、あなたの考えに最も近いものは？",
      options: [
        "著作権はツール利用者が解決すべき",
        "著作権はツール提供者が解決すべき",
        "AI生成物に著作権はない",
        "わからない",
      ],
    },
    q_learning_data: {
      question: "ご自身の作品がAIの学習データとして使われることについて、どう感じますか？",
      options: [
        "非商用であれば許容できる",
        "商用利用なら対価や許諾が必要",
        "学習用途でも事前同意が必要",
        "条件次第で許容できる",
        "原則として望ましくない",
        "よく分からない",
      ],
    },
    q_international_support: {
      question: "作品や素材を海外展開する際に欲しい支援は？（複数選択可）",
      options: [
        "各国の法制度情報の提供",
        "契約書・ライセンスの多言語化支援",
        "翻訳・ローカライズ支援",
        "海外マーケットプレイスへの出展支援",
        "国際的な権利保護の枠組み",
        "その他",
      ],
    },

    // ── AI未利用者向け ──
    section_nonuser: { title: "AIを利用していない方へ", question: "" },
    q_nonuse_reason: {
      question: "AIを利用していない主な理由を最大3つまで教えてください。",
      options: [
        "技術的な難しさ", "利用コストの高さ", "情報が見つからない",
        "著作権・倫理上の問題", "自分の仕事にはまだ不要",
        "何から始めていいか分からない",
      ],
    },

    // ── VoC ──
    section_voice: { title: "あなたの声", question: "" },
    q_good_experience: {
      question: "生成AIを使って「よかった」と感じた体験を教えてください。",
      placeholder: "自由にお書きください...",
    },
    q_message: {
      question: "本調査への質問やメッセージがあればご記入ください。",
      placeholder: "ご意見をお聞かせください...",
    },

    // ── オプション ──
    section_optional: { title: "オプション（任意）", question: "", description: "今後のご案内をご希望の方はメールアドレスをお知らせください。" },
    q_email: {
      question: "メールアドレス（任意）",
      placeholder: "you@example.com",
    },
  },
}

// ── English ──
const en: I18nStrings = {
  title: "Generative AI × Creative International Survey 2026.03",
  description: "An international survey exploring the value of regionality and language in creative fields in the AI era.",
  q: {
    q_involvement: {
      question: "In the past year, how have you been involved with generative AI?",
      options: [
        "AI-powered creative production",
        "Using AI for work tasks",
        "Viewing/purchasing AI content",
        "Not involved at all",
        "Other",
      ],
    },
    section_basic: { title: "About You", question: "" },
    q_birth_year: { question: "What year were you born?", placeholder: "e.g. 1990" },
    q_gender: { question: "What is your gender?", options: ["Male", "Female", "Non-binary", "Prefer not to say"] },
    q_occupation: {
      question: "What is your current occupation?",
      options: [
        "Freelancer/Self-employed", "Student", "Employee (non-creative)",
        "Employee (creative/production)", "Government worker", "Business owner",
        "Organization staff", "Homemaker", "Unemployed/On leave", "Other",
      ],
    },
    q_country: { question: "What country do you live in?" },
    q_prefecture: { question: "What prefecture do you live in?" },

    section_fields: { title: "Your Relationship with Creative Fields", question: "" },
    q_field_anime: { question: "Your relationship with the anime field?", options: ["Work in the industry", "Consumer/fan", "Not interested"] },
    q_field_manga: { question: "Your relationship with the manga/comics field?", options: ["Work in the industry", "Consumer/fan", "Not interested"] },
    q_field_game: { question: "Your relationship with the gaming field?", options: ["Work in the industry", "Consumer/fan", "Not interested"] },
    q_field_comm: { question: "Your relationship with the communication field (SNS, streaming, VTuber, etc.)?", options: ["Work in the industry", "Consumer/fan", "Not interested"] },

    section_value: { title: "Regionality & Language in the AI Era", question: "" },
    q_regional_value: {
      question: "In the AI era, do you think 'regionality' (cultural background, local expression) holds value in anime, manga, games, and communication?",
      options: ["Strongly agree", "Agree", "Neutral", "Disagree", "Strongly disagree"],
    },
    q_language_value: {
      question: "In the AI era, do you think 'language' (native/regional language expression) holds value in these fields?",
      options: ["Strongly agree", "Agree", "Neutral", "Disagree", "Strongly disagree"],
    },

    section_ai_usage: { title: "AI Usage", question: "" },
    q_ai_domains: {
      question: "Which generative AI domains are you using or involved with? (select all that apply)",
      options: ["Image generation", "Music generation", "Text generation", "Video generation", "Coding assistance", "Not using but interested"],
    },
    q_ai_cost: {
      question: "What is your total monthly AI tool/subscription cost?",
      options: ["Free only", "Under $10/mo", "$10–50/mo", "$50–100/mo", "$100–300/mo", "Over $300/mo"],
    },
    q_tools: { question: "Which tools/services do you use? (up to 10)" },

    section_attitude: { title: "Attitudes & Challenges", question: "" },
    q_ai_stance: {
      question: "Which best describes your current attitude toward AI?",
      options: [
        "Can't work/create without AI",
        "AI is essential but alternatives exist",
        "AI is convenient but traditional methods suffice",
        "AI is unnecessary for me",
        "Skeptical/anxious about AI",
      ],
    },
    q_bottleneck: {
      question: "What are your top bottlenecks with AI? (up to 3)",
      options: [
        "Technical difficulty", "High costs", "Too rapid evolution",
        "Lack of information", "Copyright/ethical issues", "Output quality",
        "Lack of understanding from others", "Weak native language/cultural support",
        "Unclear regulations/guidelines", "Other",
      ],
    },

    section_rights: { title: "Copyright & International", question: "" },
    q_copyright_responsibility: {
      question: "Who should be responsible for AI tool copyright issues?",
      options: ["The tool user", "The tool provider (OpenAI, Google, etc.)", "AI outputs have no copyright", "Not sure"],
    },
    q_learning_data: {
      question: "How do you feel about your work being used as AI training data?",
      options: [
        "Acceptable for non-commercial use",
        "Commercial use requires compensation/permission",
        "Prior consent required even for training",
        "Acceptable with conditions",
        "Generally undesirable",
        "Not sure",
      ],
    },
    q_international_support: {
      question: "What support would you want for international distribution? (select all)",
      options: [
        "Legal information by country",
        "Multilingual contracts/licenses",
        "Translation/localization support",
        "Marketplace access support",
        "International rights protection framework",
        "Other",
      ],
    },

    section_nonuser: { title: "For Non-AI Users", question: "" },
    q_nonuse_reason: {
      question: "Main reasons for not using AI? (up to 3)",
      options: [
        "Technical difficulty", "High costs", "Can't find reliable information",
        "Copyright/ethical concerns", "Not needed for my work",
        "Don't know where to start",
      ],
    },

    section_voice: { title: "Your Voice", question: "" },
    q_good_experience: { question: "Share a positive experience with generative AI.", placeholder: "Please write freely..." },
    q_message: { question: "Any questions or messages about this survey?", placeholder: "Your feedback..." },

    section_optional: { title: "Optional", question: "", description: "Leave your email if you'd like to receive updates." },
    q_email: { question: "Email address (optional)", placeholder: "you@example.com" },
  },
}

// ── Korean ──
const ko: I18nStrings = {
  title: "생성AI × 크리에이티브 국제 조사 2026.03",
  description: "AI 시대 크리에이티브 분야에서 지역성과 언어의 가치를 탐구하는 국제 조사",
  q: {
    q_involvement: {
      question: "지난 1년간 생성AI와 어떤 형태로 관여하셨습니까?",
      options: ["AI를 활용한 크리에이티브 제작", "AI를 업무에 활용", "AI 콘텐츠 감상·구매", "전혀 관여하지 않음", "기타"],
    },
    section_basic: { title: "기본 정보", question: "" },
    q_birth_year: { question: "출생 연도를 입력해 주세요", placeholder: "예: 1990" },
    q_gender: { question: "성별을 알려주세요.", options: ["남성", "여성", "논바이너리", "응답하지 않음"] },
    q_occupation: {
      question: "현재 직업을 알려주세요.",
      options: ["프리랜서·자영업", "학생", "회사원(비크리에이티브)", "회사원(크리에이티브/제작)", "공무원", "경영자", "단체직원", "주부·주부", "무직·휴직중", "기타"],
    },
    q_country: { question: "거주 국가를 알려주세요." },
    q_prefecture: { question: "거주 도도부현을 알려주세요." },

    section_fields: { title: "크리에이티브 분야와의 관계", question: "" },
    q_field_anime: { question: "애니메이션 분야와의 관계는?", options: ["산업 종사자", "소비자·팬", "관심 없음"] },
    q_field_manga: { question: "만화·코믹스 분야와의 관계는?", options: ["산업 종사자", "소비자·팬", "관심 없음"] },
    q_field_game: { question: "게임 분야와의 관계는?", options: ["산업 종사자", "소비자·팬", "관심 없음"] },
    q_field_comm: { question: "커뮤니케이션(SNS·스트리밍·VTuber 등) 분야와의 관계는?", options: ["산업 종사자", "소비자·팬", "관심 없음"] },

    section_value: { title: "AI 시대의 지역성과 언어", question: "" },
    q_regional_value: {
      question: "AI 시대에 애니메이션·만화·게임·커뮤니케이션 분야의 '지역성'(문화적 배경, 로컬 표현)이 가치를 가진다고 생각하십니까?",
      options: ["매우 그렇다", "그렇다", "보통", "그렇지 않다", "전혀 그렇지 않다"],
    },
    q_language_value: {
      question: "AI 시대에 이러한 분야에서 '언어'(모국어·지역 언어 표현)가 가치를 가진다고 생각하십니까?",
      options: ["매우 그렇다", "그렇다", "보통", "그렇지 않다", "전혀 그렇지 않다"],
    },

    section_ai_usage: { title: "AI 사용 현황", question: "" },
    q_ai_domains: {
      question: "사용 중인 생성AI 영역은? (복수 선택 가능)",
      options: ["이미지 생성", "음악 생성", "텍스트 생성", "동영상 생성", "코딩 지원", "사용하지 않지만 관심 있음"],
    },
    q_ai_cost: {
      question: "월간 AI 도구·구독료 합계는?",
      options: ["무료 범위", "월 1만원 미만", "월 1~5만원", "월 5~10만원", "월 10~30만원", "월 30만원 이상"],
    },
    q_tools: { question: "사용 중인 도구·서비스를 선택해 주세요 (최대 10개)" },

    section_attitude: { title: "태도와 과제", question: "" },
    q_ai_stance: {
      question: "AI 활용에 대한 현재 태도에 가장 가까운 것은?",
      options: ["AI 없이는 일·제작 불가능", "AI는 필수적이지만 대안 가능", "AI는 편리하지만 기존 방법으로도 충분", "AI는 아직 불필요", "AI에 회의적·불안"],
    },
    q_bottleneck: {
      question: "AI 활용의 병목은? (최대 3개)",
      options: ["기술적 어려움", "높은 비용", "너무 빠른 발전", "정보 부족", "저작권·윤리 문제", "결과물 품질", "주변의 이해 부족", "모국어·문화적 지원 부족", "불명확한 규제·가이드라인", "기타"],
    },

    section_rights: { title: "저작권과 국제 전개", question: "" },
    q_copyright_responsibility: {
      question: "AI 도구의 저작권에 대해 가장 가까운 생각은?",
      options: ["도구 이용자가 해결해야 한다", "도구 제공자가 해결해야 한다", "AI 생성물에 저작권은 없다", "잘 모르겠다"],
    },
    q_learning_data: {
      question: "자신의 작품이 AI 학습 데이터로 사용되는 것에 대해 어떻게 생각하십니까?",
      options: ["비상업적이면 허용 가능", "상업적 사용은 대가·허락 필요", "학습 용도도 사전 동의 필요", "조건에 따라 허용 가능", "원칙적으로 바람직하지 않다", "잘 모르겠다"],
    },
    q_international_support: {
      question: "해외 전개 시 원하는 지원은? (복수 선택)",
      options: ["각국 법제도 정보 제공", "다국어 계약서·라이선스 지원", "번역·현지화 지원", "해외 마켓플레이스 출전 지원", "국제적 권리 보호 체계", "기타"],
    },

    section_nonuser: { title: "AI를 사용하지 않는 분에게", question: "" },
    q_nonuse_reason: {
      question: "AI를 사용하지 않는 주된 이유는? (최대 3개)",
      options: ["기술적 어려움", "높은 비용", "신뢰할 수 있는 정보 부족", "저작권·윤리 문제", "업무에 불필요", "어디서부터 시작할지 모름"],
    },

    section_voice: { title: "당신의 목소리", question: "" },
    q_good_experience: { question: "생성AI를 사용하고 '좋았다'고 느낀 경험을 알려주세요.", placeholder: "자유롭게 작성해 주세요..." },
    q_message: { question: "본 조사에 대한 질문이나 메시지가 있으면 기재해 주세요.", placeholder: "의견을 들려주세요..." },

    section_optional: { title: "선택 사항", question: "", description: "향후 안내를 원하시면 이메일 주소를 알려주세요." },
    q_email: { question: "이메일 주소 (선택)", placeholder: "you@example.com" },
  },
}

// ── Chinese (Simplified) ──
const zh: I18nStrings = {
  title: "生成式AI × 创意 国际调查 2026.03",
  description: "探索AI时代创意领域中地域性与语言价值的国际调查",
  q: {
    q_involvement: {
      question: "在过去一年中，您以何种方式参与了生成式AI？",
      options: ["使用AI进行创意制作", "在工作中使用AI", "观看/购买AI内容", "完全未参与", "其他"],
    },
    section_basic: { title: "基本信息", question: "" },
    q_birth_year: { question: "请输入出生年份", placeholder: "例：1990" },
    q_gender: { question: "请选择您的性别", options: ["男", "女", "非二元", "不愿透露"] },
    q_occupation: {
      question: "请选择您目前的职业",
      options: ["自由职业", "学生", "公司职员(非创意)", "公司职员(创意/制作)", "公务员", "企业经营者", "团体职员", "家庭主妇/夫", "失业/休职", "其他"],
    },
    q_country: { question: "请选择您居住的国家" },
    q_prefecture: { question: "请选择您居住的都道府县" },

    section_fields: { title: "与创意领域的关系", question: "" },
    q_field_anime: { question: "您与动画领域的关系是？", options: ["从事该行业", "消费者/爱好者", "不感兴趣"] },
    q_field_manga: { question: "您与漫画领域的关系是？", options: ["从事该行业", "消费者/爱好者", "不感兴趣"] },
    q_field_game: { question: "您与游戏领域的关系是？", options: ["从事该行业", "消费者/爱好者", "不感兴趣"] },
    q_field_comm: { question: "您与通讯（SNS、直播、VTuber等）领域的关系是？", options: ["从事该行业", "消费者/爱好者", "不感兴趣"] },

    section_value: { title: "AI时代的地域性与语言", question: "" },
    q_regional_value: {
      question: "在AI时代，您认为动画、漫画、游戏、通讯领域的「地域性」（文化背景、本地表达）是否有价值？",
      options: ["非常同意", "同意", "中立", "不同意", "非常不同意"],
    },
    q_language_value: {
      question: "在AI时代，您认为这些领域中的「语言」（母语/地方语言表达）是否有价值？",
      options: ["非常同意", "同意", "中立", "不同意", "非常不同意"],
    },

    section_ai_usage: { title: "AI使用情况", question: "" },
    q_ai_domains: {
      question: "您使用或参与的生成式AI领域是？（可多选）",
      options: ["图像生成", "音乐生成", "文本生成", "视频生成", "编程辅助", "未使用但感兴趣"],
    },
    q_ai_cost: {
      question: "每月AI工具/订阅费用合计是？",
      options: ["免费范围", "低于50元/月", "50~300元/月", "300~700元/月", "700~2000元/月", "2000元以上/月"],
    },
    q_tools: { question: "请选择您正在使用的工具/服务（最多10个）" },

    section_attitude: { title: "态度与挑战", question: "" },
    q_ai_stance: {
      question: "您目前对AI使用的态度最接近哪一项？",
      options: ["没有AI就无法工作/创作", "AI不可或缺但有替代方案", "AI很方便但传统方法也够用", "AI对我来说还不需要", "对AI持怀疑/焦虑态度"],
    },
    q_bottleneck: {
      question: "AI使用的瓶颈是什么？（最多3个）",
      options: ["技术难度", "成本太高", "发展太快", "信息不足", "版权/伦理问题", "输出质量", "周围不理解", "母语/文化支持不足", "法规/准则不明确", "其他"],
    },

    section_rights: { title: "版权与国际", question: "" },
    q_copyright_responsibility: {
      question: "关于AI工具的版权，您的看法最接近哪一项？",
      options: ["应由工具使用者解决", "应由工具提供商解决", "AI生成物没有版权", "不确定"],
    },
    q_learning_data: {
      question: "关于您的作品被用作AI训练数据，您怎么看？",
      options: ["非商业用途可以接受", "商业用途需要报酬/许可", "即使训练也需要事先同意", "有条件地可以接受", "原则上不希望", "不确定"],
    },
    q_international_support: {
      question: "在海外推广时您需要什么支持？（可多选）",
      options: ["各国法律信息", "多语言合同/许可证支持", "翻译/本地化支持", "海外市场准入支持", "国际版权保护框架", "其他"],
    },

    section_nonuser: { title: "给未使用AI的人", question: "" },
    q_nonuse_reason: {
      question: "未使用AI的主要原因是？（最多3个）",
      options: ["技术难度", "成本太高", "找不到可靠信息", "版权/伦理顾虑", "工作上不需要", "不知道从哪里开始"],
    },

    section_voice: { title: "您的心声", question: "" },
    q_good_experience: { question: "请分享使用生成式AI的正面体验。", placeholder: "请自由填写..." },
    q_message: { question: "对本调查有什么问题或建议请填写。", placeholder: "请告诉我们您的意见..." },

    section_optional: { title: "可选项", question: "", description: "如果您希望收到后续通知，请留下邮箱地址。" },
    q_email: { question: "邮箱地址（可选）", placeholder: "you@example.com" },
  },
}

// ── French ──
const fr: I18nStrings = {
  title: "IA Générative × Créativité — Enquête Internationale 2026.03",
  description: "Enquête internationale sur la valeur de la régionalité et de la langue dans les domaines créatifs à l'ère de l'IA.",
  q: {
    q_involvement: {
      question: "Au cours de l'année écoulée, comment avez-vous été impliqué(e) dans l'IA générative ?",
      options: ["Production créative avec l'IA", "Utilisation de l'IA au travail", "Consommation de contenu IA", "Pas du tout impliqué(e)", "Autre"],
    },
    section_basic: { title: "À propos de vous", question: "" },
    q_birth_year: { question: "Quelle est votre année de naissance ?", placeholder: "ex : 1990" },
    q_gender: { question: "Quel est votre genre ?", options: ["Homme", "Femme", "Non-binaire", "Préfère ne pas répondre"] },
    q_occupation: {
      question: "Quelle est votre profession actuelle ?",
      options: ["Freelance/Indépendant", "Étudiant(e)", "Employé(e) (non créatif)", "Employé(e) (créatif/production)", "Fonctionnaire", "Chef d'entreprise", "Membre d'organisation", "Au foyer", "Sans emploi/En congé", "Autre"],
    },
    q_country: { question: "Dans quel pays vivez-vous ?" },
    q_prefecture: { question: "Dans quelle préfecture vivez-vous ?" },

    section_fields: { title: "Votre relation avec les domaines créatifs", question: "" },
    q_field_anime: { question: "Votre relation avec le domaine de l'animation ?", options: ["Travaille dans l'industrie", "Consommateur/fan", "Pas intéressé(e)"] },
    q_field_manga: { question: "Votre relation avec le domaine du manga/BD ?", options: ["Travaille dans l'industrie", "Consommateur/fan", "Pas intéressé(e)"] },
    q_field_game: { question: "Votre relation avec le domaine du jeu vidéo ?", options: ["Travaille dans l'industrie", "Consommateur/fan", "Pas intéressé(e)"] },
    q_field_comm: { question: "Votre relation avec la communication (réseaux sociaux, streaming, VTuber, etc.) ?", options: ["Travaille dans l'industrie", "Consommateur/fan", "Pas intéressé(e)"] },

    section_value: { title: "Régionalité et langue à l'ère de l'IA", question: "" },
    q_regional_value: {
      question: "À l'ère de l'IA, pensez-vous que la « régionalité » (contexte culturel, expression locale) a de la valeur dans l'animation, le manga, les jeux et la communication ?",
      options: ["Tout à fait d'accord", "D'accord", "Neutre", "Pas d'accord", "Pas du tout d'accord"],
    },
    q_language_value: {
      question: "À l'ère de l'IA, pensez-vous que la « langue » (expression en langue maternelle/régionale) a de la valeur dans ces domaines ?",
      options: ["Tout à fait d'accord", "D'accord", "Neutre", "Pas d'accord", "Pas du tout d'accord"],
    },

    section_ai_usage: { title: "Utilisation de l'IA", question: "" },
    q_ai_domains: {
      question: "Dans quels domaines utilisez-vous l'IA générative ? (plusieurs réponses possibles)",
      options: ["Génération d'images", "Génération de musique", "Génération de texte", "Génération de vidéo", "Assistance au codage", "Pas utilisé mais intéressé(e)"],
    },
    q_ai_cost: {
      question: "Quel est votre coût mensuel total en outils/abonnements IA ?",
      options: ["Gratuit uniquement", "Moins de 10€/mois", "10–50€/mois", "50–100€/mois", "100–300€/mois", "Plus de 300€/mois"],
    },
    q_tools: { question: "Quels outils/services utilisez-vous ? (jusqu'à 10)" },

    section_attitude: { title: "Attitudes et défis", question: "" },
    q_ai_stance: {
      question: "Quelle est votre attitude actuelle envers l'IA ?",
      options: ["Impossible de travailler/créer sans IA", "L'IA est essentielle mais des alternatives existent", "L'IA est pratique mais les méthodes traditionnelles suffisent", "L'IA n'est pas nécessaire pour moi", "Sceptique/anxieux vis-à-vis de l'IA"],
    },
    q_bottleneck: {
      question: "Quels sont vos principaux obstacles avec l'IA ? (jusqu'à 3)",
      options: ["Difficulté technique", "Coûts élevés", "Évolution trop rapide", "Manque d'information", "Problèmes de droits d'auteur/éthique", "Qualité des résultats", "Incompréhension de l'entourage", "Faible support linguistique/culturel", "Réglementations floues", "Autre"],
    },

    section_rights: { title: "Droits d'auteur et international", question: "" },
    q_copyright_responsibility: {
      question: "Qui devrait être responsable des questions de droits d'auteur liées aux outils IA ?",
      options: ["L'utilisateur de l'outil", "Le fournisseur de l'outil", "Les créations IA n'ont pas de droits d'auteur", "Je ne sais pas"],
    },
    q_learning_data: {
      question: "Que pensez-vous de l'utilisation de vos œuvres comme données d'entraînement IA ?",
      options: ["Acceptable pour un usage non commercial", "Usage commercial nécessite rémunération/autorisation", "Consentement préalable requis même pour l'entraînement", "Acceptable sous conditions", "Généralement indésirable", "Je ne sais pas"],
    },
    q_international_support: {
      question: "Quel soutien souhaitez-vous pour la distribution internationale ? (plusieurs réponses)",
      options: ["Informations juridiques par pays", "Contrats/licences multilingues", "Support traduction/localisation", "Accès aux marchés étrangers", "Cadre international de protection des droits", "Autre"],
    },

    section_nonuser: { title: "Pour les non-utilisateurs d'IA", question: "" },
    q_nonuse_reason: {
      question: "Principales raisons de ne pas utiliser l'IA ? (jusqu'à 3)",
      options: ["Difficulté technique", "Coûts élevés", "Information peu fiable", "Droits d'auteur/éthique", "Pas nécessaire pour mon travail", "Ne sais pas par où commencer"],
    },

    section_voice: { title: "Votre voix", question: "" },
    q_good_experience: { question: "Partagez une expérience positive avec l'IA générative.", placeholder: "Écrivez librement..." },
    q_message: { question: "Questions ou messages concernant cette enquête ?", placeholder: "Vos commentaires..." },

    section_optional: { title: "Facultatif", question: "", description: "Laissez votre email pour recevoir des mises à jour." },
    q_email: { question: "Adresse email (facultatif)", placeholder: "you@example.com" },
  },
}

// ── Spanish ──
const es: I18nStrings = {
  title: "IA Generativa × Creatividad — Encuesta Internacional 2026.03",
  description: "Encuesta internacional que explora el valor de la regionalidad y el idioma en los campos creativos en la era de la IA.",
  q: {
    q_involvement: {
      question: "En el último año, ¿cómo ha estado involucrado/a con la IA generativa?",
      options: ["Producción creativa con IA", "Uso de IA en el trabajo", "Consumo de contenido IA", "No involucrado/a en absoluto", "Otro"],
    },
    section_basic: { title: "Sobre usted", question: "" },
    q_birth_year: { question: "¿En qué año nació?", placeholder: "ej: 1990" },
    q_gender: { question: "¿Cuál es su género?", options: ["Masculino", "Femenino", "No binario", "Prefiero no decir"] },
    q_occupation: {
      question: "¿Cuál es su ocupación actual?",
      options: ["Freelance/Autónomo", "Estudiante", "Empleado/a (no creativo)", "Empleado/a (creativo/producción)", "Funcionario/a", "Empresario/a", "Personal de organización", "Ama/o de casa", "Desempleado/a", "Otro"],
    },
    q_country: { question: "¿En qué país vive?" },
    q_prefecture: { question: "¿En qué prefectura vive?" },

    section_fields: { title: "Su relación con los campos creativos", question: "" },
    q_field_anime: { question: "¿Su relación con el campo del anime?", options: ["Trabajo en la industria", "Consumidor/fan", "No me interesa"] },
    q_field_manga: { question: "¿Su relación con el campo del manga/cómic?", options: ["Trabajo en la industria", "Consumidor/fan", "No me interesa"] },
    q_field_game: { question: "¿Su relación con el campo de los videojuegos?", options: ["Trabajo en la industria", "Consumidor/fan", "No me interesa"] },
    q_field_comm: { question: "¿Su relación con la comunicación (redes sociales, streaming, VTuber, etc.)?", options: ["Trabajo en la industria", "Consumidor/fan", "No me interesa"] },

    section_value: { title: "Regionalidad e idioma en la era de la IA", question: "" },
    q_regional_value: {
      question: "En la era de la IA, ¿cree que la 'regionalidad' (contexto cultural, expresión local) tiene valor en el anime, manga, juegos y comunicación?",
      options: ["Muy de acuerdo", "De acuerdo", "Neutral", "En desacuerdo", "Muy en desacuerdo"],
    },
    q_language_value: {
      question: "En la era de la IA, ¿cree que el 'idioma' (expresión en lengua materna/regional) tiene valor en estos campos?",
      options: ["Muy de acuerdo", "De acuerdo", "Neutral", "En desacuerdo", "Muy en desacuerdo"],
    },

    section_ai_usage: { title: "Uso de IA", question: "" },
    q_ai_domains: {
      question: "¿En qué áreas usa IA generativa? (selección múltiple)",
      options: ["Generación de imágenes", "Generación de música", "Generación de texto", "Generación de video", "Asistencia en programación", "No uso pero me interesa"],
    },
    q_ai_cost: {
      question: "¿Cuál es su gasto mensual total en herramientas/suscripciones de IA?",
      options: ["Solo gratuito", "Menos de 10€/mes", "10–50€/mes", "50–100€/mes", "100–300€/mes", "Más de 300€/mes"],
    },
    q_tools: { question: "¿Qué herramientas/servicios usa? (hasta 10)" },

    section_attitude: { title: "Actitudes y desafíos", question: "" },
    q_ai_stance: {
      question: "¿Cuál describe mejor su actitud actual hacia la IA?",
      options: ["No puedo trabajar/crear sin IA", "La IA es esencial pero hay alternativas", "La IA es práctica pero los métodos tradicionales bastan", "La IA no es necesaria para mí", "Escéptico/ansioso sobre la IA"],
    },
    q_bottleneck: {
      question: "¿Cuáles son sus principales obstáculos con la IA? (hasta 3)",
      options: ["Dificultad técnica", "Costos elevados", "Evolución demasiado rápida", "Falta de información", "Problemas de derechos de autor/ética", "Calidad del resultado", "Incomprensión del entorno", "Débil soporte lingüístico/cultural", "Regulaciones poco claras", "Otro"],
    },

    section_rights: { title: "Derechos de autor e internacional", question: "" },
    q_copyright_responsibility: {
      question: "¿Quién debería ser responsable de los derechos de autor de las herramientas de IA?",
      options: ["El usuario de la herramienta", "El proveedor de la herramienta", "Las creaciones de IA no tienen derechos de autor", "No estoy seguro/a"],
    },
    q_learning_data: {
      question: "¿Cómo se siente respecto a que sus obras se usen como datos de entrenamiento de IA?",
      options: ["Aceptable para uso no comercial", "Uso comercial requiere compensación/permiso", "Se necesita consentimiento previo", "Aceptable bajo condiciones", "Generalmente indeseable", "No estoy seguro/a"],
    },
    q_international_support: {
      question: "¿Qué apoyo necesitaría para la distribución internacional? (selección múltiple)",
      options: ["Información legal por país", "Contratos/licencias multilingües", "Soporte de traducción/localización", "Acceso a mercados internacionales", "Marco internacional de protección de derechos", "Otro"],
    },

    section_nonuser: { title: "Para no usuarios de IA", question: "" },
    q_nonuse_reason: {
      question: "¿Principales razones para no usar IA? (hasta 3)",
      options: ["Dificultad técnica", "Costos elevados", "Información no confiable", "Derechos de autor/ética", "No necesario para mi trabajo", "No sé por dónde empezar"],
    },

    section_voice: { title: "Su voz", question: "" },
    q_good_experience: { question: "Comparta una experiencia positiva con la IA generativa.", placeholder: "Escriba libremente..." },
    q_message: { question: "¿Preguntas o mensajes sobre esta encuesta?", placeholder: "Sus comentarios..." },

    section_optional: { title: "Opcional", question: "", description: "Deje su email si desea recibir actualizaciones." },
    q_email: { question: "Dirección de email (opcional)", placeholder: "you@example.com" },
  },
}

// ── Translation map ──
const I18N: Record<R2603Lang, I18nStrings> = { ja, en, ko, zh, fr, es }

// ── Question structure (language-independent) ──
function buildQuestions(t: I18nStrings): SurveyQuestion[] {
  return [
    // ── AIとの関わり方 ──
    { id: "q_involvement", type: "single_choice", question: t.q.q_involvement.question, required: true, options: t.q.q_involvement.options },

    // ── 基本情報 ──
    { id: "section_basic", type: "section", title: t.q.section_basic.title },
    { id: "q_birth_year", type: "text", question: t.q.q_birth_year.question, placeholder: t.q.q_birth_year.placeholder, required: true, autoAnswer: true },
    { id: "q_gender", type: "single_choice", question: t.q.q_gender.question, required: true, options: t.q.q_gender.options },
    { id: "q_occupation", type: "single_choice", question: t.q.q_occupation.question, required: true, options: t.q.q_occupation.options },
    { id: "q_country", type: "dropdown", question: t.q.q_country.question, required: true, options: COUNTRIES_EN },
    // Japan-only: prefecture (conditionally shown)
    { id: "q_prefecture", type: "dropdown", question: t.q.q_prefecture.question, required: true, options: JP_PREFECTURES, skipIf: { questionId: "q_country", notEquals: "Japan" } },

    // ── 分野との関係（新規） ──
    { id: "section_fields", type: "section", title: t.q.section_fields.title },
    { id: "q_field_anime", type: "single_choice", question: t.q.q_field_anime.question, required: true, options: t.q.q_field_anime.options },
    { id: "q_field_manga", type: "single_choice", question: t.q.q_field_manga.question, required: true, options: t.q.q_field_manga.options },
    { id: "q_field_game", type: "single_choice", question: t.q.q_field_game.question, required: true, options: t.q.q_field_game.options },
    { id: "q_field_comm", type: "single_choice", question: t.q.q_field_comm.question, required: true, options: t.q.q_field_comm.options },

    // ── 地域性と言語の価値（新規） ──
    { id: "section_value", type: "section", title: t.q.section_value.title },
    { id: "q_regional_value", type: "single_choice", question: t.q.q_regional_value.question, required: true, options: t.q.q_regional_value.options },
    { id: "q_language_value", type: "single_choice", question: t.q.q_language_value.question, required: true, options: t.q.q_language_value.options },

    // ── AI利用（AI利用者のみ） ──
    { id: "section_ai_usage", type: "section", title: t.q.section_ai_usage.title, skipIf: { questionId: "q_involvement", equals: t.q.q_involvement.options![3] } }, // "全く関わっていない" equivalent
    { id: "q_ai_domains", type: "multi_choice", question: t.q.q_ai_domains.question, required: true, options: t.q.q_ai_domains.options, skipIf: { questionId: "q_involvement", equals: t.q.q_involvement.options![3] } },
    { id: "q_ai_cost", type: "single_choice", question: t.q.q_ai_cost.question, required: true, options: t.q.q_ai_cost.options, skipIf: { questionId: "q_involvement", equals: t.q.q_involvement.options![3] } },
    { id: "q_tools", type: "multi_choice", question: t.q.q_tools.question, required: true, maxSelections: 10, popularOptions: TOOL_POPULAR, options: TOOL_OPTIONS, skipIf: { questionId: "q_involvement", equals: t.q.q_involvement.options![3] } },

    // ── 態度 ──
    { id: "section_attitude", type: "section", title: t.q.section_attitude.title, skipIf: { questionId: "q_involvement", equals: t.q.q_involvement.options![3] } },
    { id: "q_ai_stance", type: "single_choice", question: t.q.q_ai_stance.question, required: true, options: t.q.q_ai_stance.options, skipIf: { questionId: "q_involvement", equals: t.q.q_involvement.options![3] } },
    { id: "q_bottleneck", type: "multi_choice", question: t.q.q_bottleneck.question, required: true, maxSelections: 3, options: t.q.q_bottleneck.options, skipIf: { questionId: "q_involvement", equals: t.q.q_involvement.options![3] } },

    // ── 著作権・国際（DCAJ） ──
    { id: "section_rights", type: "section", title: t.q.section_rights.title },
    { id: "q_copyright_responsibility", type: "single_choice", question: t.q.q_copyright_responsibility.question, required: true, options: t.q.q_copyright_responsibility.options },
    { id: "q_learning_data", type: "single_choice", question: t.q.q_learning_data.question, required: true, options: t.q.q_learning_data.options },
    { id: "q_international_support", type: "multi_choice", question: t.q.q_international_support.question, required: false, options: t.q.q_international_support.options },

    // ── AI未利用者向け ──
    { id: "section_nonuser", type: "section", title: t.q.section_nonuser.title, skipIf: { questionId: "q_involvement", notEquals: t.q.q_involvement.options![3] } },
    { id: "q_nonuse_reason", type: "multi_choice", question: t.q.q_nonuse_reason.question, required: true, maxSelections: 3, options: t.q.q_nonuse_reason.options, skipIf: { questionId: "q_involvement", notEquals: t.q.q_involvement.options![3] } },

    // ── VoC ──
    { id: "section_voice", type: "section", title: t.q.section_voice.title },
    { id: "q_good_experience", type: "textarea", question: t.q.q_good_experience.question, placeholder: t.q.q_good_experience.placeholder, required: false },
    { id: "q_message", type: "textarea", question: t.q.q_message.question, placeholder: t.q.q_message.placeholder, required: false },

    // ── オプション ──
    { id: "section_optional", type: "section", title: t.q.section_optional.title, description: t.q.section_optional.description },
    { id: "q_email", type: "text", question: t.q.q_email.question, placeholder: t.q.q_email.placeholder, required: false },
  ]
}

// ── Config factory ──
export function getR2603Config(lang: R2603Lang = "ja"): SurveyConfig {
  const t = I18N[lang] || I18N.ja
  return {
    title: t.title,
    description: t.description,
    submitUrl: "/api/surveys/R2603",
    estimatedMinutes: 3,
    opensAt: "2026-03-12T00:00:00+09:00",
    availableLangs: [...R2603_LANGS],
    currentLang: lang,
    questions: buildQuestions(t),
  }
}

// Default export for registry (Japanese)
export const R2603_CONFIG = getR2603Config("ja")
