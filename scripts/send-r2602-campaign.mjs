#!/usr/bin/env node
/**
 * send-r2602-campaign.mjs
 *
 * R2602調査の告知メールをGAS経由で送信
 *
 * Usage:
 *   node scripts/send-r2602-campaign.mjs create            # キャンペーン作成
 *   node scripts/send-r2602-campaign.mjs test EMAIL        # テスト送信
 *   node scripts/send-r2602-campaign.mjs import-wix        # Wixコンタクトをインポート (dry run)
 *   node scripts/send-r2602-campaign.mjs import-wix --send # 実際にインポート
 *   node scripts/send-r2602-campaign.mjs send              # 全配信 (dry run)
 *   node scripts/send-r2602-campaign.mjs send --send       # 全配信 (本番)
 */

import fs from "fs"

// ── .env.local 読み込み ──
const envLines = fs.readFileSync(".env.local", "utf8").split("\n")
const ENV = {}
for (const l of envLines) {
  const m = l.match(/^([^#=]+)=(.*)$/)
  if (m) ENV[m[1].trim()] = m[2].trim()
}

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

<p>前回ご参加いただいた皆様、ありがとうございました。AICUでは、<strong>生成AIクリエイターの創作プロセス・権利意識・制度ニーズ</strong>を定量的に把握する大規模調査を実施中です。一般財団法人デジタルコンテンツ協会（DCAJ）との協力により、生成AIの安全性確保に向けた学術研究・政策提言に活用します。</p>

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
  ブログ: <a href="https://note.com/aicu/n/n8177fcff5fa4">生成AI時代の「つくる人」調査R2602始動！クリエイターの声を可視化しよう</a><br>
  プレスリリース: <a href="https://prtimes.jp/main/html/rd/p/000000033.000133647.html">チャットで答える新感覚アンケート「AIQ」を採用！（PRTIMES）</a><br>
  データ利用方針: <a href="https://p.aicu.jp/q/R2602/policy">p.aicu.jp/R2602/policy</a><br>
  学術利用問合せ: <a href="mailto:R2602@aicu.jp">R2602@aicu.jp</a>
</p>
`

// ── GAS API helper ──
async function gasPost(action, params = {}, timeoutMs = 30000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const body = JSON.stringify({ action, ...params })
    const res = await fetch(GAS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      redirect: "follow",
      signal: controller.signal,
    })
    clearTimeout(timer)
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      console.error("GAS response not JSON:", text.slice(0, 500))
      return { success: false, error: "Invalid JSON response" }
    }
  } catch (e) {
    clearTimeout(timer)
    if (e.name === "AbortError") {
      return { success: false, error: `Timeout after ${timeoutMs}ms` }
    }
    throw e
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

// ── Wix Members + Contacts API ──
// Members SDKのhasNext/nextで全460件取得 → contactIdで個別にContact取得

import { createClient, ApiKeyStrategy } from "@wix/sdk"
import { members as membersModule } from "@wix/members"

function getWixClient() {
  return createClient({
    auth: ApiKeyStrategy({ apiKey: ENV.WIX_API_KEY, siteId: ENV.WIX_SITE_ID }),
    modules: { members: membersModule },
  })
}

async function fetchContactById(contactId) {
  const res = await fetch(`https://www.wixapis.com/contacts/v4/contacts/${contactId}`, {
    headers: {
      Authorization: ENV.WIX_API_KEY,
      "wix-site-id": ENV.WIX_SITE_ID,
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.contact || null
}

async function getAllWixMemberEmails() {
  const wix = getWixClient()

  // Step 1: Members SDK で全メンバーの contactId を取得
  console.log("  Step 1: Fetching all members via SDK...")
  const allMembers = []
  let result = await wix.members.queryMembers().limit(100).find()
  allMembers.push(...(result.items || []))
  process.stdout.write(`\r  Members: ${allMembers.length}/${result.totalCount || "?"}`)

  while (result.hasNext && result.hasNext()) {
    result = await result.next()
    allMembers.push(...(result.items || []))
    process.stdout.write(`\r  Members: ${allMembers.length}/${result.totalCount || "?"}`)
  }
  console.log(`\n  Total members: ${allMembers.length}`)

  // Step 2: contactId ごとに Contact REST API でメール取得（並列10件ずつ）
  console.log("  Step 2: Fetching emails via Contacts REST API...")
  const emailMap = new Map()
  const batchSize = 10
  let fetched = 0

  for (let i = 0; i < allMembers.length; i += batchSize) {
    const batch = allMembers.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map((m) => fetchContactById(m.contactId))
    )

    for (const contact of results) {
      if (!contact) continue
      const email =
        contact.primaryInfo?.email ||
        contact.info?.emails?.items?.[0]?.email
      if (!email) continue

      const key = email.toLowerCase()
      if (emailMap.has(key)) continue

      const name = contact.info?.name || {}
      emailMap.set(key, {
        email,
        firstName: name.first || "",
        lastName: name.last || "",
      })
    }

    fetched += batch.length
    process.stdout.write(`\r  Contacts: ${fetched}/${allMembers.length} → ${emailMap.size} emails`)
  }
  console.log("")

  return emailMap
}

async function importWixContacts(dryRun) {
  console.log("Fetching Wix member emails...")
  const emailMap = await getAllWixMemberEmails()

  console.log(`\nTotal unique emails: ${emailMap.size}`)

  if (dryRun) {
    console.log("\n[DRY RUN] Add --send to actually import to GAS")
    console.log(`  Sample (first 5):`)
    let i = 0
    for (const [, v] of emailMap) {
      if (i++ >= 5) break
      console.log(`    ${v.lastName} ${v.firstName} <${v.email}>`)
    }
    return { total: emailMap.size, imported: 0 }
  }

  // GAS に subscribe で登録（既存は自動スキップ）
  let imported = 0
  let skipped = 0
  let errors = 0

  for (const [, contact] of emailMap) {
    try {
      const result = await gasPost("subscribe", {
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
      })
      if (result.success) {
        if (result.message === "Already registered") {
          skipped++
        } else {
          imported++
        }
      } else {
        errors++
        console.error(`  Error: ${contact.email}: ${result.error}`)
      }
    } catch (e) {
      errors++
      console.error(`  Error: ${contact.email}: ${e.message}`)
    }

    // GAS rate limit 対策: 10件ごとに1秒待つ
    if ((imported + skipped + errors) % 10 === 0) {
      process.stdout.write(`\r  Progress: ${imported} imported, ${skipped} existing, ${errors} errors`)
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  console.log(`\n\nDone: ${imported} imported, ${skipped} already existed, ${errors} errors`)
  return { total: emailMap.size, imported, skipped, errors }
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
  case "enqueue": {
    // 下書きを一括作成（Gmail送信クォータに影響しない）
    const dryRun = !args.includes("--send")
    const listQ = await gasPost("listCampaigns")
    const campaignQ = listQ.data
      ?.filter((c) => c.name === CAMPAIGN_NAME && c.status === "draft")
      .pop()
    if (!campaignQ) {
      console.error("No draft campaign found. Run 'create' first.")
      process.exit(1)
    }
    console.log(`Campaign: ${campaignQ.id}`)
    console.log(`Subject: ${campaignQ.subject}`)

    console.log("\nFetching member emails...")
    const emailMapQ = await getAllWixMemberEmails()
    console.log(`Total members: ${emailMapQ.size}`)

    console.log("Checking Gmail sent folder...")
    const sentQ = await gasPost("getSentEmails", {
      subject: "生成AIクリエイター調査",
      after: "2026/02/19",
    })
    const alreadySentQ = new Set(sentQ.data?.recipients || [])
    console.log(`Already sent: ${alreadySentQ.size}`)

    // 下書きフォルダも確認（件名一致で重複防止）
    // → GAS側で getDrafts は重いので、ここではsent除外のみ

    const toEnqueue = []
    for (const [key, contact] of emailMapQ) {
      if (!alreadySentQ.has(key)) {
        toEnqueue.push(contact)
      }
    }
    console.log(`Drafts to create: ${toEnqueue.length}`)
    console.log(`Mode: ${dryRun ? "DRY RUN" : "CREATE DRAFTS"}`)

    if (dryRun) {
      console.log("\nAdd --send to actually create drafts in Gmail")
      break
    }

    let created = 0
    let errorsQ = 0
    const startQ = Date.now()

    for (const contact of toEnqueue) {
      try {
        const result = await gasPost("createDraft", {
          id: campaignQ.id,
          email: contact.email,
        })
        if (result.success) {
          created++
        } else {
          errorsQ++
          console.error(`\n  Error: ${contact.email}: ${result.error}`)
        }
      } catch (e) {
        errorsQ++
        console.error(`\n  Error: ${contact.email}: ${e.message}`)
      }

      if ((created + errorsQ) % 5 === 0) {
        process.stdout.write(`\r  Drafts: ${created}/${toEnqueue.length} (errors: ${errorsQ})`)
      }
      // 下書き作成はクォータ軽いが、GASリクエスト制限があるので1秒待つ
      await new Promise((r) => setTimeout(r, 1000))
    }

    const totalQ = ((Date.now() - startQ) / 1000).toFixed(0)
    console.log(`\n\nDone: ${created} drafts created, ${errorsQ} errors in ${totalQ}s`)
    console.log("Next: GAS will send 50 drafts daily at 9 AM, or run 'send-drafts' manually")
    break
  }
  case "send-drafts": {
    const limit = parseInt(args[0] || "50", 10)
    console.log(`Sending up to ${limit} drafts...`)
    const result = await gasPost("sendDrafts", {
      subject: "生成AIクリエイター調査を開催中",
      limit: String(limit),
    })
    console.log("Result:", JSON.stringify(result, null, 2))
    break
  }
  case "check-sent": {
    console.log("Checking Gmail sent folder for R2602 campaign...")
    const sentResult = await gasPost("getSentEmails", {
      subject: "生成AIクリエイター調査",
      after: "2026/02/19",
    })
    if (sentResult.success) {
      console.log(`Sent threads: ${sentResult.data.threadCount}`)
      console.log(`Unique recipients: ${sentResult.data.recipientCount}`)
    } else {
      console.error("Error:", sentResult.error)
    }
    break
  }
  case "import-wix": {
    const dryRun = !args.includes("--send")
    await importWixContacts(dryRun)
    break
  }
  case "send": {
    const dryRun = !args.includes("--send")
    // Find latest draft campaign (use .pop() for newest)
    const list = await gasPost("listCampaigns")
    const campaign = list.data
      ?.filter((c) => c.name === CAMPAIGN_NAME && c.status === "draft")
      .pop()
    if (!campaign) {
      console.error("No draft campaign found. Run 'create' first.")
      process.exit(1)
    }
    console.log(`Campaign: ${campaign.id} [${campaign.status}]`)
    console.log(`Subject: ${campaign.subject}`)

    // Wix全メンバーのメールリストを取得
    console.log("\nFetching member emails...")
    const emailMap = await getAllWixMemberEmails()
    console.log(`Total members: ${emailMap.size}`)

    // Gmail送信済みアドレスを除外
    console.log("\nChecking Gmail sent folder...")
    const sentResult = await gasPost("getSentEmails", {
      subject: "生成AIクリエイター調査",
      after: "2026/02/19",
    })
    const alreadySent = new Set(sentResult.data?.recipients || [])
    console.log(`Already sent: ${alreadySent.size}`)

    const toSend = []
    for (const [key, contact] of emailMap) {
      if (!alreadySent.has(key)) {
        toSend.push(contact)
      }
    }
    console.log(`Remaining to send: ${toSend.length}`)
    console.log(`Mode: ${dryRun ? "DRY RUN" : "PRODUCTION"}`)

    if (dryRun) {
      console.log("\nAdd --send to actually send")
    } else {
      // Node側から1件ずつGASのsendToOneで送信（GAS 6分制限を回避）
      let sent = 0
      let errors = 0
      const errorList = []
      const startTime = Date.now()

      for (const contact of toSend) {
        try {
          const result = await gasPost("sendToOne", {
            id: campaign.id,
            email: contact.email,
          })
          if (result.success) {
            sent++
          } else {
            errors++
            errorList.push(`${contact.email}: ${result.error}`)
            console.error(`\n  Error: ${contact.email}: ${result.error}`)
          }
        } catch (e) {
          errors++
          errorList.push(`${contact.email}: ${e.message}`)
          console.error(`\n  Error: ${contact.email}: ${e.message}`)
        }

        if ((sent + errors) % 5 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
          const rate = ((sent + errors) / (Date.now() - startTime) * 1000).toFixed(2)
          process.stdout.write(`\r  Sent: ${sent}/${toSend.length} (errors: ${errors}) [${elapsed}s, ${rate}/s]`)
        }
        // GAS rate limit: 3秒に1件
        await new Promise((r) => setTimeout(r, 3000))
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(0)
      console.log(`\n\nDone: ${sent} sent, ${errors} errors out of ${toSend.length} in ${totalTime}s`)
      console.log(`Rate: ${(sent / (Date.now() - startTime) * 1000 * 60).toFixed(1)} emails/min`)
      if (errorList.length > 0) {
        console.log("Errors:")
        errorList.forEach((e) => console.log("  " + e))
      }
    }
    break
  }
  default:
    console.log(`
Usage:
  node scripts/send-r2602-campaign.mjs create              # Create campaign
  node scripts/send-r2602-campaign.mjs list                 # List campaigns
  node scripts/send-r2602-campaign.mjs test EMAIL           # Test send
  node scripts/send-r2602-campaign.mjs import-wix           # Wixコンタクトをインポート (dry run)
  node scripts/send-r2602-campaign.mjs import-wix --send    # 実際にインポート
  node scripts/send-r2602-campaign.mjs send                 # Send to all (dry run)
  node scripts/send-r2602-campaign.mjs send --send          # Send to all (production)
    `)
}
