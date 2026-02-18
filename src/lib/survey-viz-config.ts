// Survey visualization configuration — question → chart type mapping

export type VizType =
  | "stacked-bar"
  | "donut"
  | "regional-pie"
  | "age-pie"
  | "tag-cloud"
  | "paired-bar"
  | "horizontal-bar"

export const VIZ_MAP: Record<string, VizType> = {
  // Stacked Bar (2〜5択)
  entry_217192455: "stacked-bar",   // AI関与 (5択)
  entry_1821980007: "stacked-bar",  // 性別 (3択)
  entry_35926345: "stacked-bar",    // 有償実績 (4択)
  entry_454206106: "stacked-bar",   // 著作権 (3択)
  entry_1667631330: "stacked-bar",  // インタビュー協力 (2択)

  // Donut (single_choice / 中規模選択肢)
  entry_1957471882: "donut",  // 職業 (10択)
  entry_274138831: "donut",   // 売上帯 (6択)
  entry_1024046675: "donut",  // AI月額費用 (9択)
  entry_998532907: "donut",   // 学習投資 (9択)
  entry_505387619: "donut",   // GPU (12択)
  entry_34298640: "donut",    // AI態度 (5択)
  entry_2077750738: "donut",  // AI領域 (6択)
  entry_1228619554: "donut",  // AI関係性 (10択)
  entry_2000848438: "donut",  // 学習方法 (6択)
  entry_282284746: "donut",   // 教育サービス (5択)
  entry_1533319614: "donut",  // 証明書 (5択)
  entry_448099795: "donut",   // 二次創作条件 (6択)
  dcaj_Q2: "donut",           // オリジナリティ (5択)

  // Regional Pie
  entry_1357554301: "regional-pie",  // 居住地域

  // Age Bucket Pie
  entry_170746194: "age-pie",  // 生まれた年

  // Tag Cloud (多数選択肢)
  entry_1878680578: "tag-cloud",  // ツール (46個)
  dcaj_Q7: "tag-cloud",          // クリエイター価値 (13個)

  // Paired Bar (効果対比)
  Q_effect_done: "paired-bar",
  Q_effect_want: "paired-bar",

  // Horizontal Bar (残り全て)
  entry_885269464: "horizontal-bar",   // セクター (14択)
  entry_1829344839: "horizontal-bar",  // OS/ハード (9択)
  entry_537892144: "horizontal-bar",   // ボトルネック (14択)
  dcaj_Q1: "horizontal-bar",           // ワークフロー (8択)
  dcaj_Q3: "horizontal-bar",           // 学習データ態度 (12択)
  dcaj_Q4: "horizontal-bar",           // 仕事変化 (8択)
  dcaj_Q5: "horizontal-bar",           // 倫理懸念 (8択)
  dcaj_Q6: "horizontal-bar",           // 法制度評価 (10択)
  dcaj_Q8: "horizontal-bar",           // 国の支援 (7択)
  dcaj_Q9: "horizontal-bar",           // 海外展開 (6択)
  entry_722928489: "horizontal-bar",   // 証明価値 (10択)
  entry_333973041: "horizontal-bar",   // 公開プラットフォーム (16択)
  entry_953637123: "horizontal-bar",   // 非利用理由 (6択)
}

// 都道府県 → 地域ブロック
export const REGIONAL_BLOCKS: Record<string, string> = {
  北海道: "北海道",
  青森県: "東北", 岩手県: "東北", 宮城県: "東北", 秋田県: "東北", 山形県: "東北", 福島県: "東北",
  茨城県: "関東", 栃木県: "関東", 群馬県: "関東", 埼玉県: "関東", 千葉県: "関東", 東京都: "関東", 神奈川県: "関東",
  新潟県: "中部", 富山県: "中部", 石川県: "中部", 福井県: "中部", 山梨県: "中部", 長野県: "中部", 岐阜県: "中部", 静岡県: "中部", 愛知県: "中部",
  三重県: "近畿", 滋賀県: "近畿", 京都府: "近畿", 大阪府: "近畿", 兵庫県: "近畿", 奈良県: "近畿", 和歌山県: "近畿",
  鳥取県: "中国", 島根県: "中国", 岡山県: "中国", 広島県: "中国", 山口県: "中国",
  徳島県: "四国", 香川県: "四国", 愛媛県: "四国", 高知県: "四国",
  福岡県: "九州沖縄", 佐賀県: "九州沖縄", 長崎県: "九州沖縄", 熊本県: "九州沖縄", 大分県: "九州沖縄", 宮崎県: "九州沖縄", 鹿児島県: "九州沖縄", 沖縄県: "九州沖縄",
  海外: "海外",
}

export const REGIONAL_BLOCK_ORDER = ["関東", "近畿", "中部", "九州沖縄", "東北", "北海道", "中国", "四国", "海外"]

// 生年 → 年齢層バケット (current year = 2026)
export function birthYearToBucket(year: number): string {
  const age = 2026 - year
  if (age < 20) return "〜19歳"
  if (age < 30) return "20代"
  if (age < 40) return "30代"
  if (age < 50) return "40代"
  if (age < 60) return "50代"
  return "60歳以上"
}

export const AGE_BUCKET_ORDER = ["〜19歳", "20代", "30代", "40代", "50代", "60歳以上"]

// Paired bar questions (to be rendered together)
export const PAIRED_BAR_IDS = { done: "Q_effect_done", want: "Q_effect_want" } as const

// Color palette for charts
export const CHART_COLORS = [
  "#41C9B4", "#0031D8", "#FF6B6B", "#FFD93D", "#6BCB77",
  "#4D96FF", "#FF922B", "#CC5DE8", "#20C997", "#FF8787",
  "#748FFC", "#F06595",
]

export const REGIONAL_COLORS: Record<string, string> = {
  関東: "#41C9B4",
  近畿: "#0031D8",
  中部: "#FF6B6B",
  "九州沖縄": "#FFD93D",
  東北: "#6BCB77",
  北海道: "#4D96FF",
  中国: "#FF922B",
  四国: "#CC5DE8",
  海外: "#20C997",
}
