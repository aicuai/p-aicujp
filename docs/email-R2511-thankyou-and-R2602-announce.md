# R2511参加者向けメール原案

送信元: info@aicu.jp (GAS aicujp-mail-sender)
送信先: R2511回答者（survey_responses で survey_id='R2511' かつ email IS NOT NULL）
送信時期: 2026年2月19日〜（R2602公開と同時）

---

## メール1: R2511お礼 + R2602案内（1通にまとめる案）

**件名**: 【AICU】R2511調査へのご参加ありがとうございました — 第2回調査R2602のご案内

---

{name} 様

AICU Japan の白井です。

2025年11月に実施した「生成AI時代の"つくる人"調査（R2511）」にご参加いただき、誠にありがとうございました。

おかげさまで53名の方にご回答いただき、生成AIクリエイターの実態を浮き彫りにする貴重なデータを得ることができました。

### R2511 調査結果のハイライト

皆さまのご回答から、以下のような発見がありました。

- 回答者の **85%が「AI制作者」** — 鑑賞者ではなく、実際につくっている人が集まりました
- **53%が「AIなしでは仕事が成り立たない」** — 91%がAIを不可欠と認識
- **収益化の二極化** — 47%が有償実績なし、一方で33%が年間100万円以上
- **女性42%、フリーランス34%** — 多様な「つくる人」像が見えてきました
- **「時間短縮」は90%が実現済み**、しかし「新規受注」は期待止まり

詳しい分析結果は以下で公開しています：
https://u.aicu.jp/r/R2511

---

### 第2回調査「R2602」のご案内

この結果を踏まえ、本日より第2回調査 **「生成AI時代の"つくる人"調査 2026.02（R2602）」** を開始しました。

今回は **一般財団法人デジタルコンテンツ協会（DCAJ）** との協力により、政策提言や学術研究に直結する設問を大幅に拡充しています。

**新テーマ:**
- 創作プロセスとAIの関係
- オリジナリティと作者性の再定義
- 権利・報酬・制度への要望
- 人間のクリエイターにしかできないこと

**参加特典:**
- **10,000 AICUポイント** を回答完了後に自動付与（月刊AICU・Amazonギフト券等と交換可能）
- **回答者限定の結果速報ページ** をリアルタイムで閲覧可能

所要時間は約5分。AIチャット形式でサクサク回答できます。

▶ **いますぐ参加する: https://p.aicu.jp/R2602**

---

前回ご協力いただいた皆さまの声が、今回の調査設計に大きく反映されています。ぜひ第2回にもご参加いただき、生成AI時代のクリエイターの「いま」を一緒に可視化させてください。

お知り合いのクリエイターにもシェアいただけると幸いです。

AICU Japan 株式会社
代表取締役 白井暁彦
https://aicu.jp

---

## 送信方法メモ

### 送信対象リストの取得（Supabase）
```sql
SELECT DISTINCT email
FROM survey_responses
WHERE survey_id = 'R2511'
  AND email IS NOT NULL
  AND is_test IS NOT TRUE;
```

### GAS送信（aicujp-mail-sender）
- WebApp: `AKfycbzRFmxG_epgOQVyVMktfTIrDOYSuYvpdl4D_QqE-KFFusw_5U3zDGDK8-rS7xckktPo`
- Sender: `info@aicu.jp`
- POST body: `{ to, subject, body }` (HTMLメール対応)
- Node.js fetch で送信（curl は GAS redirect で body が消えるため不可）

### 送信スクリプト例
```javascript
// scripts/send-r2511-thankyou.mjs
const GAS_URL = "https://script.google.com/macros/s/AKfycbzRFmxG_epgOQVyVMktfTIrDOYSuYvpdl4D_QqE-KFFusw_5U3zDGDK8-rS7xckktPo/exec"

async function sendEmail(to, subject, htmlBody) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, body: htmlBody }),
    redirect: "follow",
  })
  return res.text()
}
```

### 注意事項
- GASの1日あたり送信上限: 100通（Google Workspace）
- 53名なら1回で送信可能
- テスト送信: まず aki@aicu.ai に送って確認
- {name} の差し込みは survey_responses の回答データから取得するか、"参加者" で統一
