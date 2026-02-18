#!/usr/bin/env node
/**
 * send-r2511-thankyou.mjs — R2511お礼 + R2602案内メール送信
 *
 * Usage:
 *   node scripts/send-r2511-thankyou.mjs                    # テスト送信 (aki@aicu.ai)
 *   node scripts/send-r2511-thankyou.mjs test user@example   # テスト送信 (指定アドレス)
 *   node scripts/send-r2511-thankyou.mjs send                # 本番送信 (要確認)
 *
 * Requires .env.local:
 *   GAS_WEBAPP_URL — aicujp-mail-sender WebApp URL
 */

import { readFileSync } from 'fs'

// Load .env.local manually
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const GAS_URL = process.env.GAS_WEBAPP_URL
const MODE = process.argv[2] || 'test'   // 'test' or 'send'
const TEST_EMAIL = process.argv[3] || 'aki@aicu.ai'

const CAMPAIGN_ID = 'R2511-thankyou-R2602'
const SUBJECT = '【AICU】R2511調査へのご参加ありがとうございました — 第2回調査R2602のご案内'

const CONTENT_HTML = `
<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans JP',sans-serif;color:#333;line-height:1.8;">

  <div style="text-align:center;padding:24px 0 16px;">
    <a href="https://p.aicu.jp/q/R2602" style="text-decoration:none;">
      <img src="https://p.aicu.jp/images/email/r2602-banner-600.jpg" alt="生成AIつくる人調査 R2602" style="width:100%;max-width:600px;height:auto;border-radius:12px;" />
    </a>
  </div>
  <div style="text-align:center;padding:0 0 16px;">
    <span style="font-family:'Outfit',sans-serif;font-size:24px;font-weight:800;color:#41C9B4;">AICU</span>
    <span style="font-size:16px;font-weight:600;color:#1a1a2e;margin-left:6px;">Japan</span>
  </div>

  <p>{{last_name}} {{first_name}} さま</p>

  <p>いつもAICUをご利用いただきありがとうございます。AICU Japan の白井です。</p>

  <p>2025年11月に実施した「生成AI時代の"つくる人"調査（R2511）」にご参加いただいた皆さまに、お礼と調査結果のご報告、そして第2回調査のご案内をお送りします。</p>

  <div style="background:#f8f9fa;border-left:4px solid #41C9B4;border-radius:0 8px 8px 0;padding:20px 24px;margin:24px 0;">
    <div style="font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:12px;">R2511 調査結果ハイライト（n=53）</div>
    <ul style="margin:0;padding-left:20px;font-size:14px;line-height:2;">
      <li>回答者の <strong>85%が「AI制作者」</strong> — つくる人が集まった調査</li>
      <li><strong>53%が「AIなしでは仕事が成り立たない」</strong> — 91%がAI不可欠と認識</li>
      <li><strong>収益化の二極化</strong> — 47%が有償実績なし / 33%が年間100万円以上</li>
      <li><strong>女性42%、フリーランス34%</strong> — 多様な「つくる人」像</li>
      <li><strong>「時間短縮」は90%実現済み</strong>、「新規受注」は期待止まり</li>
    </ul>
    <div style="margin-top:12px;text-align:center;">
      <a href="https://u.aicu.jp/r/R2511" style="color:#0031D8;font-size:14px;font-weight:600;">▶ 詳しい分析結果を見る</a>
    </div>
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">

  <div style="background:#f0f7ff;border:1px solid #d0e3ff;border-radius:12px;padding:20px 24px;margin:24px 0;">
    <div style="font-size:17px;font-weight:700;color:#0031D8;margin-bottom:12px;">第2回調査「R2602」のご案内</div>
    <p style="margin:0 0 12px;font-size:14px;">前回の結果を踏まえ、<strong>一般財団法人デジタルコンテンツ協会（DCAJ）</strong>との協力により、政策提言・学術研究に直結する設問を大幅に拡充した第2回調査を開始しました。</p>
    <ul style="margin:0 0 12px;padding-left:20px;font-size:14px;">
      <li>創作プロセスとAIの関係</li>
      <li>オリジナリティと作者性の再定義</li>
      <li>権利・報酬・制度への要望</li>
      <li>人間のクリエイターにしかできないこと</li>
    </ul>
    <ul style="margin:0;padding-left:20px;font-size:14px;">
      <li>所要時間: 約5分（AIチャット形式）</li>
      <li>謝礼: <strong>10,000 AICUポイント</strong>（回答完了後に自動付与）</li>
    </ul>
  </div>

  <div style="text-align:center;margin:32px 0;">
    <a href="https://p.aicu.jp/q/R2602?email={{email}}"
       style="display:inline-block;background:#0031D8;color:#fff;padding:16px 48px;border-radius:12px;font-size:17px;font-weight:700;text-decoration:none;box-shadow:0 4px 20px rgba(0,49,216,0.25);">
      R2602 に回答する
    </a>
  </div>

  <div style="background:#fafafa;border-radius:8px;padding:16px;margin:24px 0;font-size:13px;color:#555;">
    <div style="font-weight:700;margin-bottom:8px;">AICUポイントについて</div>
    <p style="margin:0 0 8px;">AICUポイントは「月刊AICU」やAmazonギフト券などと交換できます。</p>
    <ul style="margin:0;padding-left:20px;">
      <li><a href="https://www.aicu.blog/rewards" style="color:#0031D8;">現在の獲得ポイントを確認する</a></li>
      <li><a href="https://www.aicu.blog/category/all-products" style="color:#0031D8;">ストア商品一覧を見る</a></li>
    </ul>
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">

  <p style="font-size:14px;">前回ご協力いただいた皆さまの声が、今回の調査設計に大きく反映されています。ぜひ第2回にもご参加いただき、生成AI時代のクリエイターの「いま」を一緒に可視化させてください。</p>

  <p style="font-size:14px;">お知り合いのクリエイターにもシェアいただけると幸いです。</p>

  <div style="font-size:14px;color:#666;">
    <strong>前回調査結果:</strong>
    <a href="https://u.aicu.jp/r/R2511" style="color:#0031D8;">R2511（2025年11月調査）</a><br>
    <strong>プライバシーポリシー:</strong>
    <a href="https://corp.aicu.ai/ja/privacy" style="color:#0031D8;">corp.aicu.ai/ja/privacy</a>
  </div>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:13px;color:#888;">
    AICU Japan 株式会社 / 代表取締役 白井暁彦<br>
    <a href="https://aicu.jp" style="color:#41C9B4;">aicu.jp</a> ·
    <a href="https://p.aicu.jp" style="color:#41C9B4;">p.aicu.jp</a>
  </div>
</div>
`

async function main() {
  if (!GAS_URL) {
    console.error('GAS_WEBAPP_URL not set in .env.local')
    process.exit(1)
  }

  console.log(`Mode: ${MODE}`)
  console.log(`GAS endpoint: ${GAS_URL}`)

  // Step 1: Register campaign
  console.log('\n1. Registering campaign...')
  const addRes = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addCampaign',
      id: CAMPAIGN_ID,
      name: 'R2511お礼 + R2602案内',
      subject: SUBJECT,
      content_html: CONTENT_HTML,
      status: 'draft',
    }),
    redirect: 'follow',
  })
  const addData = await addRes.json()
  console.log('addCampaign result:', JSON.stringify(addData, null, 2))

  const actualCampaignId = addData.data?.id || CAMPAIGN_ID

  if (MODE === 'test') {
    // Step 2a: Test send to single address
    const target = TEST_EMAIL
    console.log(`\n2. Test sending to: ${target} (campaign: ${actualCampaignId})`)
    const sendRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'testSendTo',
        id: actualCampaignId,
        email: target,
      }),
      redirect: 'follow',
    })
    const sendData = await sendRes.json()
    console.log('testSendTo result:', JSON.stringify(sendData, null, 2))

    if (sendData.success) {
      console.log(`\n✓ Test email sent to ${target}`)
      console.log('\nTo send to all subscribers:')
      console.log('  node scripts/send-r2511-thankyou.mjs send')
    } else {
      console.error(`\n✗ Failed: ${sendData.error}`)
    }
  } else if (MODE === 'send') {
    // Step 2b: Send to all subscribers
    console.log('\n⚠️  PRODUCTION SEND — sending to ALL subscribers')
    console.log('Campaign:', actualCampaignId)

    // Confirm
    const readline = await import('readline')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise(resolve => {
      rl.question('Type "YES" to confirm: ', resolve)
    })
    rl.close()

    if (answer !== 'YES') {
      console.log('Cancelled.')
      return
    }

    console.log('\nSending campaign...')
    const sendRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendCampaign',
        id: actualCampaignId,
      }),
      redirect: 'follow',
    })
    const sendData = await sendRes.json()
    console.log('sendCampaign result:', JSON.stringify(sendData, null, 2))

    if (sendData.success) {
      console.log(`\n✓ Campaign sent successfully!`)
    } else {
      console.error(`\n✗ Failed: ${sendData.error}`)
    }
  } else {
    console.error(`Unknown mode: ${MODE}. Use 'test' or 'send'.`)
  }
}

main().catch(console.error)
