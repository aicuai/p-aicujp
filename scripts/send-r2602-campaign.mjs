#!/usr/bin/env node
/**
 * send-r2602-campaign.mjs
 *
 * R2602調査の告知メールをGAS経由で送信
 *
 * Usage:
 *   node scripts/send-r2602-campaign.mjs create        # キャンペーン作成
 *   node scripts/send-r2602-campaign.mjs test EMAIL     # テスト送信
 *   node scripts/send-r2602-campaign.mjs import-wix     # Wixメンバーをインポート (dry run)
 *   node scripts/send-r2602-campaign.mjs import-wix --send  # 実際にインポート
 *   node scripts/send-r2602-campaign.mjs send           # 全配信 (dry run)
 *   node scripts/send-r2602-campaign.mjs send --send    # 全配信 (本番)
 */

const GAS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbzRFmxG_epgOQVyVMktfTIrDOYSuYvpdl4D_QqE-KFFusw_5U3zDGDK8-rS7xckktPo/exec"

// ── Campaign content ──
const CAMPAIGN_NAME = "R2602-announce-wix"
const CAMPAIGN_SUBJECT = "【AICU】3分で完了！生成AIクリエイター調査を開催中！謝礼 10,000AICUポイント"

// Use HTML directly for rich email with images
const CAMPAIGN_HTML = `
<div style="text-align:center;margin-bottom:24px">
  <a href="https://p.aicu.jp/R2602">
    <img src="https://prcdn.freetls.fastly.net/release_image/133647/33/133647-33-694a38c19909efee65399464d4603187-1200x628.jpg" alt="生成AI時代のつくる人調査 2026.02" style="max-width:100%;border-radius:8px" />
  </a>
</div>

<h1 style="font-size:22px;color:#1a1a2e;text-align:center;margin-bottom:8px">生成AI時代の"つくる人"調査 2026.02</h1>
<p style="text-align:center;color:#666;font-size:14px;margin-bottom:24px">AICU Japan × デジタルコンテンツ協会（DCAJ）共同調査</p>

<p>AICUでは、<strong>生成AIクリエイターの創作プロセス・権利意識・制度ニーズ</strong>を定量的に把握する大規模調査を実施中です。一般財団法人デジタルコンテンツ協会（DCAJ）との協力により、生成AIの安全性確保に向けた学術研究・政策提言に活用します。</p>

<h2 style="font-size:18px;color:#0031D8;border-bottom:2px solid #0031D8;padding-bottom:6px">現在のAIクリエイターがどんなツールを使っているのか？</h2>

<p>ChatGPT、ComfyUI、Midjourney、Runway……<strong>今、現役のAIクリエイターが実際に何を使い、いくら投資し、どんな課題を感じているのか</strong>。参加者だけが見られる<a href="https://p.aicu.jp/q/R2602/results">結果速報ページ</a>でリアルタイムに確認できます。</p>

<div style="text-align:center;margin:20px 0">
  <a href="https://p.aicu.jp/q/R2602/results">
    <img src="https://prcdn.freetls.fastly.net/release_image/133647/33/133647-33-f0fa5d3cfa243b14140df0160f980c97-3432x1698.png" alt="ツール利用状況" style="max-width:100%;border-radius:8px;border:1px solid #eee" />
  </a>
  <p style="font-size:11px;color:#999;margin-top:4px">前回調査（R2511, n=53）のツール利用データ。今回はさらに大規模に調査中</p>
</div>

<h2 style="font-size:18px;color:#0031D8">回答はたった3分</h2>

<p>AIチャット型アンケート「AIQ」を採用。一問一答の対話形式で、ストレスなく回答できます。</p>

<div style="text-align:center;margin:24px 0">
  <a href="https://p.aicu.jp/R2602" style="display:inline-block;background:#0031D8;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">今すぐ回答する → p.aicu.jp/R2602</a>
</div>

<h2 style="font-size:18px;color:#0031D8">謝礼</h2>

<p>回答完了で <strong>10,000 AICUポイント</strong>を自動付与！（月刊AICU・Amazonギフト券と交換可能）</p>

<h2 style="font-size:18px;color:#0031D8;border-bottom:2px solid #0031D8;padding-bottom:6px">4つの調査テーマ</h2>

<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px">
  <tr style="border-bottom:1px solid #eee">
    <td style="padding:8px;font-weight:bold;color:#0031D8;width:30%">1. 創作プロセス</td>
    <td style="padding:8px;color:#333">ワークフローにおけるAIの役割を構造的に把握</td>
  </tr>
  <tr style="border-bottom:1px solid #eee">
    <td style="padding:8px;font-weight:bold;color:#0031D8">2. 作者性</td>
    <td style="padding:8px;color:#333">AI時代のオリジナリティの根拠を定量化</td>
  </tr>
  <tr style="border-bottom:1px solid #eee">
    <td style="padding:8px;font-weight:bold;color:#0031D8">3. 権利・報酬</td>
    <td style="padding:8px;color:#333">無断学習への態度、必要な法制度</td>
  </tr>
  <tr>
    <td style="padding:8px;font-weight:bold;color:#0031D8">4. 人間の価値</td>
    <td style="padding:8px;color:#333">クリエイターにしかできない13の価値</td>
  </tr>
</table>

<div style="text-align:center;margin:24px 0">
  <a href="https://p.aicu.jp/R2602" style="display:inline-block;background:#0031D8;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">今すぐ回答する → p.aicu.jp/R2602</a>
</div>

<hr style="border:none;border-top:1px solid #eee;margin:24px 0" />

<p style="font-size:12px;color:#888">
  調査概要: <a href="https://prtimes.jp/main/html/rd/p/000000033.000133647.html">プレスリリース（PRTIMES）</a><br>
  データ利用方針: <a href="https://p.aicu.jp/q/R2602/policy">p.aicu.jp/R2602/policy</a><br>
  学術利用問合せ: <a href="mailto:R2602@aicu.jp">R2602@aicu.jp</a>
</p>
`

// ── GAS API helper ──
async function gasPost(action, params = {}) {
  const body = JSON.stringify({ action, ...params })
  const res = await fetch(GAS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    redirect: "follow",
  })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    console.error("GAS response not JSON:", text.slice(0, 500))
    return { success: false, error: "Invalid JSON response" }
  }
}

// ── Commands ──

async function createCampaign() {
  console.log("Creating campaign...")
  const result = await gasPost("addCampaign", {
    name: CAMPAIGN_NAME,
    subject: CAMPAIGN_SUBJECT,
    content_html: CAMPAIGN_HTML,
    status: "draft",
  })
  console.log("Result:", JSON.stringify(result, null, 2))
  if (result.success) {
    console.log(`\nCampaign created: ${result.data.id}`)
    console.log(`Save this ID for test/send commands.`)
  }
  return result
}

async function testSend(campaignId, email) {
  console.log(`Sending test to ${email}...`)
  const result = await gasPost("testSendTo", { id: campaignId, email })
  console.log("Result:", JSON.stringify(result, null, 2))
  return result
}

async function listCampaigns() {
  const result = await gasPost("listCampaigns")
  if (result.success) {
    for (const c of result.data) {
      console.log(`  ${c.id}  [${c.status}]  ${c.name}  "${c.subject}"`)
    }
  }
  return result
}

// ── Main ──
const [, , command, ...args] = process.argv

switch (command) {
  case "create": {
    await createCampaign()
    break
  }
  case "test": {
    const email = args[0]
    if (!email) {
      console.error("Usage: node send-r2602-campaign.mjs test EMAIL [CAMPAIGN_ID]")
      process.exit(1)
    }
    // Find campaign ID
    let campaignId = args[1]
    if (!campaignId) {
      console.log("No campaign ID provided, looking for latest draft...")
      const list = await gasPost("listCampaigns")
      if (list.success) {
        const draft = list.data.filter((c) => c.status === "draft" && c.name === CAMPAIGN_NAME).pop()
        if (draft) {
          campaignId = draft.id
          console.log(`Found: ${campaignId}`)
        } else {
          console.error("No draft campaign found. Run 'create' first.")
          process.exit(1)
        }
      }
    }
    await testSend(campaignId, email)
    break
  }
  case "list": {
    await listCampaigns()
    break
  }
  case "send": {
    const dryRun = !args.includes("--send")
    // Find campaign
    const list = await gasPost("listCampaigns")
    const campaign = list.data?.find((c) => c.name === CAMPAIGN_NAME)
    if (!campaign) {
      console.error("Campaign not found. Run 'create' first.")
      process.exit(1)
    }
    console.log(`Campaign: ${campaign.id} [${campaign.status}]`)
    console.log(`Mode: ${dryRun ? "DRY RUN" : "PRODUCTION"}`)
    if (dryRun) {
      console.log("\nAdd --send to actually send to all subscribers")
    } else {
      const result = await gasPost("sendCampaign", { id: campaign.id, testMode: "false" })
      console.log("Result:", JSON.stringify(result, null, 2))
    }
    break
  }
  default:
    console.log(`
Usage:
  node scripts/send-r2602-campaign.mjs create          # Create campaign
  node scripts/send-r2602-campaign.mjs list             # List campaigns
  node scripts/send-r2602-campaign.mjs test EMAIL       # Test send
  node scripts/send-r2602-campaign.mjs send             # Send to all (dry run)
  node scripts/send-r2602-campaign.mjs send --send      # Send to all (production)
    `)
}
