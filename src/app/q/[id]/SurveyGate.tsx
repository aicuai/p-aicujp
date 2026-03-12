"use client"

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

import { useState, useEffect, useMemo, useRef } from "react"
import type { SurveyConfig } from "@/data/surveys"
import SurveyForm from "./SurveyForm"

// ── Gate UI translations ──
const GATE_I18N: Record<string, {
  estimatedMinutes: (n: number) => string
  reward: (r: string) => string
  ageVerification: string
  year: string
  month: string
  day: string
  yearSuffix: string
  monthSuffix: string
  daySuffix: string
  termsAgree: string
  termsLink: string
  privacyAgree: string
  privacyLink: string
  startButton: string
  closedTitle: string
  closedEnded: string
  opensAt: (d: string) => string
  rewardNote: (r: string) => string
  thanksTitle: string
}> = {
  ja: {
    estimatedMinutes: (n) => `所要時間: 約${n}分`,
    reward: (r) => `報酬: ${r}`,
    ageVerification: "年齢確認（生年月日）",
    year: "年", month: "月", day: "日",
    yearSuffix: "年", monthSuffix: "月", daySuffix: "日",
    termsAgree: "に同意する", termsLink: "利用規約",
    privacyAgree: "に同意する", privacyLink: "プライバシーポリシー",
    startButton: "同意して開始",
    closedTitle: "このアンケートは現在、入力を受け付けておりません。",
    closedEnded: "調査期間は終了しました。",
    opensAt: (d) => `開始予定: ${d}`,
    rewardNote: (r) => `報酬: ${r}（開始後に回答可能になります）`,
    thanksTitle: "ご協力ありがとうございました。",
  },
  en: {
    estimatedMinutes: (n) => `Estimated time: ~${n} min`,
    reward: (r) => `Reward: ${r}`,
    ageVerification: "Age verification (date of birth)",
    year: "Year", month: "Month", day: "Day",
    yearSuffix: "", monthSuffix: "", daySuffix: "",
    termsAgree: "I agree to the ", termsLink: "Terms of Service",
    privacyAgree: "I agree to the ", privacyLink: "Privacy Policy",
    startButton: "Agree & Start",
    closedTitle: "This survey is not currently accepting responses.",
    closedEnded: "The survey period has ended.",
    opensAt: (d) => `Opens: ${d}`,
    rewardNote: (r) => `Reward: ${r} (available after opening)`,
    thanksTitle: "Thank you for your participation.",
  },
  ko: {
    estimatedMinutes: (n) => `소요 시간: 약 ${n}분`,
    reward: (r) => `보상: ${r}`,
    ageVerification: "연령 확인 (생년월일)",
    year: "년", month: "월", day: "일",
    yearSuffix: "년", monthSuffix: "월", daySuffix: "일",
    termsAgree: "에 동의합니다", termsLink: "이용약관",
    privacyAgree: "에 동의합니다", privacyLink: "개인정보 처리방침",
    startButton: "동의하고 시작",
    closedTitle: "현재 이 설문은 응답을 받지 않고 있습니다.",
    closedEnded: "조사 기간이 종료되었습니다.",
    opensAt: (d) => `시작 예정: ${d}`,
    rewardNote: (r) => `보상: ${r} (시작 후 응답 가능)`,
    thanksTitle: "참여해 주셔서 감사합니다.",
  },
  zh: {
    estimatedMinutes: (n) => `预计时间：约${n}分钟`,
    reward: (r) => `奖励：${r}`,
    ageVerification: "年龄验证（出生日期）",
    year: "年", month: "月", day: "日",
    yearSuffix: "年", monthSuffix: "月", daySuffix: "日",
    termsAgree: "我同意", termsLink: "使用条款",
    privacyAgree: "我同意", privacyLink: "隐私政策",
    startButton: "同意并开始",
    closedTitle: "本问卷目前不接受回答。",
    closedEnded: "调查期间已结束。",
    opensAt: (d) => `开始时间：${d}`,
    rewardNote: (r) => `奖励：${r}（开始后可回答）`,
    thanksTitle: "感谢您的参与。",
  },
  fr: {
    estimatedMinutes: (n) => `Durée estimée : ~${n} min`,
    reward: (r) => `Récompense : ${r}`,
    ageVerification: "Vérification de l'âge (date de naissance)",
    year: "Année", month: "Mois", day: "Jour",
    yearSuffix: "", monthSuffix: "", daySuffix: "",
    termsAgree: "J'accepte les ", termsLink: "Conditions d'utilisation",
    privacyAgree: "J'accepte la ", privacyLink: "Politique de confidentialité",
    startButton: "Accepter et commencer",
    closedTitle: "Ce questionnaire n'accepte pas de réponses actuellement.",
    closedEnded: "La période d'enquête est terminée.",
    opensAt: (d) => `Ouverture : ${d}`,
    rewardNote: (r) => `Récompense : ${r} (disponible après ouverture)`,
    thanksTitle: "Merci de votre participation.",
  },
  es: {
    estimatedMinutes: (n) => `Tiempo estimado: ~${n} min`,
    reward: (r) => `Recompensa: ${r}`,
    ageVerification: "Verificación de edad (fecha de nacimiento)",
    year: "Año", month: "Mes", day: "Día",
    yearSuffix: "", monthSuffix: "", daySuffix: "",
    termsAgree: "Acepto los ", termsLink: "Términos de servicio",
    privacyAgree: "Acepto la ", privacyLink: "Política de privacidad",
    startButton: "Aceptar y comenzar",
    closedTitle: "Esta encuesta no acepta respuestas actualmente.",
    closedEnded: "El período de la encuesta ha terminado.",
    opensAt: (d) => `Apertura: ${d}`,
    rewardNote: (r) => `Recompensa: ${r} (disponible tras la apertura)`,
    thanksTitle: "Gracias por su participación.",
  },
}

type Props = {
  surveyId: string
  config: SurveyConfig
  email?: string
}

type Participation = Record<string, boolean>

const CONSENT_KEY_PREFIX = "consent_q_"
const BLUE = "#0031D8"

function yearOptions() {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= 1920; y--) years.push(y)
  return years
}

const months = Array.from({ length: 12 }, (_, i) => i + 1)

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export default function SurveyGate({ surveyId, config, email }: Props) {
  const t = GATE_I18N[config.currentLang || "ja"] || GATE_I18N.ja
  const [phase, setPhase] = useState<"gate" | "survey">("gate")
  const [birthYear, setBirthYear] = useState("")
  const [birthMonth, setBirthMonth] = useState("")
  const [birthDay, setBirthDay] = useState("")
  const [termsChecked, setTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [participation, setParticipation] = useState<Participation | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  // Send gate beacon (LP view tracking)
  const beaconSent = useRef(false)
  useEffect(() => {
    if (beaconSent.current) return
    beaconSent.current = true
    try {
      let sid = localStorage.getItem(`lgf_sid_${config.sourceUrl || surveyId}`)
      if (!sid) {
        sid = crypto.randomUUID()
        localStorage.setItem(`lgf_sid_${config.sourceUrl || surveyId}`, sid)
      }
      const body = JSON.stringify({
        surveyId: config.sourceUrl || surveyId,
        sessionId: sid,
        step: -1, // -1 = gate view (before survey)
        answeredCount: 0,
        totalQuestions: 0,
      })
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/surveys/beacon", new Blob([body], { type: "application/json" }))
      } else {
        fetch("/api/surveys/beacon", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {})
      }
    } catch { /* ignore */ }
  }, [surveyId, config.sourceUrl])

  // Check if already consented
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY_PREFIX + surveyId)
      if (saved) setPhase("survey")
    } catch { /* ignore */ }
  }, [surveyId])

  // Fetch participation status
  useEffect(() => {
    if (!email) return
    setLoadingStatus(true)
    fetch(`/api/surveys/${surveyId}/status?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.participated) setParticipation(data.participated)
      })
      .catch(() => { /* ignore */ })
      .finally(() => setLoadingStatus(false))
  }, [email, surveyId])

  const dayOptions = useMemo(() => {
    if (!birthYear || !birthMonth) return Array.from({ length: 31 }, (_, i) => i + 1)
    return Array.from(
      { length: daysInMonth(Number(birthYear), Number(birthMonth)) },
      (_, i) => i + 1,
    )
  }, [birthYear, birthMonth])

  const canProceed = birthYear && birthMonth && birthDay && termsChecked && privacyChecked

  const handleConsent = () => {
    if (!canProceed) return
    const consent = {
      birthDate: `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`,
      termsAgreed: true,
      privacyAgreed: true,
      consentedAt: new Date().toISOString(),
    }
    try {
      localStorage.setItem(CONSENT_KEY_PREFIX + surveyId, JSON.stringify(consent))
    } catch { /* ignore */ }
    // GTAG: survey consent
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "survey_consent", { survey_id: surveyId })
    }
    // Beacon: gate passed (step=0 means consent given, ready for survey)
    try {
      const sid = localStorage.getItem(`lgf_sid_${config.sourceUrl || surveyId}`)
      if (sid) {
        const body = JSON.stringify({
          surveyId: config.sourceUrl || surveyId,
          sessionId: sid,
          step: 0,
          answeredCount: 0,
          totalQuestions: 0,
        })
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/surveys/beacon", new Blob([body], { type: "application/json" }))
        } else {
          fetch("/api/surveys/beacon", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {})
        }
      }
    } catch { /* ignore */ }
    setPhase("survey")
  }

  // Extract birth year from consent data (current form state or saved localStorage)
  const consentBirthYear = useMemo(() => {
    // If user just filled the gate form, use that value
    if (birthYear) return birthYear
    // Otherwise read from localStorage (returning user)
    try {
      const saved = localStorage.getItem(CONSENT_KEY_PREFIX + surveyId)
      if (saved) {
        const consent = JSON.parse(saved)
        if (consent.birthDate) return consent.birthDate.split("-")[0]
      }
    } catch { /* ignore */ }
    return ""
  }, [birthYear, surveyId])

  // Check if survey is open
  const now = new Date()
  const opensAt = config.opensAt ? new Date(config.opensAt) : null
  const closesAt = config.closesAt ? new Date(config.closesAt) : null
  const isClosed = (opensAt && now < opensAt) || (closesAt && now > closesAt)

  if (isClosed) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#f8f9fa", color: "#1a1a2e",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "40px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Noto Sans JP', sans-serif",
      }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <a href="https://aicu.jp" target="_blank" rel="noopener" style={{
            display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24,
            textDecoration: "none",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #41C9B4, #2BA594)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 3px 10px rgba(65, 201, 180, 0.25)",
            }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", color: "#fff", fontWeight: 800, fontSize: 20 }}>A</span>
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: "#41C9B4" }}>
              AICU
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e" }}>Research</span>
          </a>
          <div style={{
            width: 68, height: 68, borderRadius: 20, margin: "0 auto 20px",
            background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
          }}>
            &#128340;
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#1a1a2e" }}>
            {opensAt && now < opensAt
              ? t.closedTitle
              : t.thanksTitle
            }
          </h2>
          <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7 }}>
            {opensAt && now < opensAt
              ? t.opensAt(opensAt.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }))
              : t.closedEnded
            }
          </p>
          {config.reward && opensAt && now < opensAt && (
            <p style={{ fontSize: 14, color: "#999", marginTop: 12 }}>
              {t.rewardNote(config.reward)}
            </p>
          )}
          {/* R2602: note.com embed for results article */}
          {surveyId === "R2602" && closesAt && now > closesAt && (
            <div style={{ marginTop: 24, textAlign: "left" }}>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 12, textAlign: "center" }}>
                <a href="https://note.com/aicu/n/n4b137c2f2bf6" target="_blank" rel="noopener" style={{ color: BLUE, textDecoration: "underline" }}>
                  生成AI時代の&quot;つくる人&quot;調査（R2602）中間報告
                </a>
              </p>
              <NoteEmbed noteUrl="https://note.com/embed/notes/n4b137c2f2bf6" />
            </div>
          )}
          <div style={{ marginTop: 32, fontSize: 12, color: "#bbb" }}>
            Powered by{" "}
            <span style={{ fontFamily: "'Outfit', sans-serif", color: "var(--aicu-teal, #41C9B4)", fontWeight: 700 }}>AICU</span>
            {" "}Research
          </div>
        </div>
      </div>
    )
  }

  // Skip gate for closed/workshop surveys
  if (config.skipGate || phase === "survey") {
    return <SurveyForm surveyId={surveyId} config={config} email={email} birthYear={consentBirthYear} />
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "#f8f9fa", color: "#1a1a2e",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Noto Sans JP', sans-serif",
    }}>
      <div style={{ maxWidth: 440, width: "100%", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a href="https://aicu.jp" target="_blank" rel="noopener" style={{
            display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16,
            textDecoration: "none",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #41C9B4, #2BA594)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 3px 10px rgba(65, 201, 180, 0.25)",
            }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", color: "#fff", fontWeight: 800, fontSize: 20 }}>A</span>
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: "#41C9B4" }}>
              AICU
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e" }}>Research</span>
          </a>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: 8, color: "#1a1a2e" }}>
            {config.title}
          </h2>
          {config.description && (
            <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6 }}>{config.description}</p>
          )}
          {/* Language switcher */}
          {config.availableLangs && config.availableLangs.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {config.availableLangs.map((lang) => {
                const labels: Record<string, string> = { ja: "日本語", en: "English", ko: "한국어", zh: "中文", fr: "Français", es: "Español" }
                const isActive = lang === (config.currentLang || "ja")
                return (
                  <a
                    key={lang}
                    href={`?lang=${lang}`}
                    style={{
                      padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      textDecoration: "none",
                      background: isActive ? BLUE : "rgba(0,0,0,0.05)",
                      color: isActive ? "#fff" : "#666",
                      transition: "all 0.2s",
                    }}
                  >
                    {labels[lang] || lang}
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Info block */}
        <div style={{
          padding: "16px 20px", borderRadius: 16, marginBottom: 24,
          background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
          fontSize: 13, color: "#888", lineHeight: 2,
        }}>
          {config.estimatedMinutes && <div>{t.estimatedMinutes(config.estimatedMinutes)}</div>}
          {config.reward && <div>{t.reward(config.reward)}</div>}
          {surveyId === "R2602" && (
            <>
              <div>
                前回調査結果:{" "}
                <a href="https://u.aicu.jp/r/R2511" target="_blank" rel="noopener" style={{ color: BLUE, textDecoration: "underline" }}>R2511</a>
              </div>
              <div>
                結果速報の例:{" "}
                <a href="/q/R2602/results" style={{ color: BLUE, textDecoration: "underline" }}>R2602 速報ページ</a>
              </div>
              <div>
                データ利用方針:{" "}
                <a href="/q/R2602/policy" target="_blank" rel="noopener" style={{ color: BLUE, textDecoration: "underline" }}>p.aicu.jp/q/R2602/policy</a>
              </div>
              <div>
                調査協力:{" "}
                <a href="https://www.dcaj.or.jp/" target="_blank" rel="noopener" style={{ color: BLUE, textDecoration: "underline" }}>一般財団法人デジタルコンテンツ協会</a>
                {" "}(DCAJ)
              </div>
            </>
          )}
        </div>

        {/* Participation status */}
        {email && (
          <div style={{
            padding: "16px 20px", borderRadius: 16, marginBottom: 24,
            background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#999", marginBottom: 10 }}>
              過去の参加状況
            </div>
            {loadingStatus ? (
              <div style={{ fontSize: 14, color: "#999" }}>読み込み中...</div>
            ) : participation ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(participation).map(([sid, done]) => (
                  <div key={sid} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                    <span style={{ color: done ? "#34d399" : "#ccc" }}>
                      {done ? "✓" : "○"}
                    </span>
                    <span style={{ color: done ? "#333" : "#999" }}>
                      {sid}
                    </span>
                    <span style={{ fontSize: 12, color: "#bbb" }}>
                      {done ? "回答済み" : "未回答"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: "#999" }}>情報なし</div>
            )}
          </div>
        )}

        {/* Birthday */}
        <div style={{
          padding: "16px 20px", borderRadius: 16, marginBottom: 20,
          background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#999", marginBottom: 12 }}>
            {t.ageVerification}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} style={selectStyle}>
              <option value="">{t.year}</option>
              {yearOptions().map((y) => (
                <option key={y} value={y}>{y}{t.yearSuffix}</option>
              ))}
            </select>
            <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} style={selectStyle}>
              <option value="">{t.month}</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}{t.monthSuffix}</option>
              ))}
            </select>
            <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} style={selectStyle}>
              <option value="">{t.day}</option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>{d}{t.daySuffix}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Consent checkboxes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: BLUE }}
            />
            <span style={{ color: "#333" }}>
              {t.termsAgree}<a href="https://www.aicu.blog/terms/plan-free" target="_blank" rel="noopener" style={{ color: BLUE, textDecoration: "underline" }}>{t.termsLink}</a>
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: BLUE }}
            />
            <span style={{ color: "#333" }}>
              {t.privacyAgree}<a href="https://corp.aicu.ai/ja/privacy" target="_blank" rel="noopener" style={{ color: BLUE, textDecoration: "underline" }}>{t.privacyLink}</a>
            </span>
          </label>
        </div>

        {/* Submit button */}
        <button
          onClick={handleConsent}
          disabled={!canProceed}
          style={{
            width: "100%", padding: "16px 24px", borderRadius: 12,
            border: "none", fontSize: 17, fontWeight: 700,
            fontFamily: "inherit", cursor: canProceed ? "pointer" : "default",
            background: canProceed ? BLUE : "rgba(0,0,0,0.08)",
            color: canProceed ? "#fff" : "#bbb",
            transition: "all 0.2s",
            boxShadow: canProceed ? "0 4px 20px rgba(0,49,216,0.25)" : "none",
          }}
        >
          {t.startButton}
        </button>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#bbb" }}>
          Powered by{" "}
          <span style={{ fontFamily: "'Outfit', sans-serif", color: "var(--aicu-teal, #41C9B4)", fontWeight: 700 }}>AICU</span>
          {" "}Research
        </div>
      </div>
    </div>
  )
}

function NoteEmbed({ noteUrl }: { noteUrl: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    // Load note.com embed script
    if (!document.querySelector('script[src*="note.com/scripts/embed.js"]')) {
      const s = document.createElement("script")
      s.src = "https://note.com/scripts/embed.js"
      s.async = true
      s.charset = "utf-8"
      document.head.appendChild(s)
    }
  }, [])
  return (
    <div ref={ref}>
      <iframe
        className="note-embed"
        src={noteUrl}
        style={{
          border: 0, display: "block", maxWidth: "99%",
          width: 494, padding: 0, margin: "10px 0",
        }}
        height={400}
      />
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  flex: 1, padding: "10px 8px", borderRadius: 12,
  background: "#fff", border: "1px solid rgba(0,0,0,0.12)",
  color: "#333", fontSize: 15, fontFamily: "inherit",
  appearance: "auto" as const, WebkitAppearance: "menulist" as const,
}
