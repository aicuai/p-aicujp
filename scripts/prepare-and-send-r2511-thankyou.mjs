#!/usr/bin/env node
/**
 * prepare-and-send-r2511-thankyou.mjs
 *
 * Step 1: Fetch Wix member emails
 * Step 2: Register them as GAS contacts (subscribe)
 * Step 3: Send campaign (immediate or scheduled)
 *
 * Usage:
 *   node scripts/prepare-and-send-r2511-thankyou.mjs prepare     # Wix→GAS contacts登録
 *   node scripts/prepare-and-send-r2511-thankyou.mjs status      # GAS contacts数を確認
 *   node scripts/prepare-and-send-r2511-thankyou.mjs send        # 送信実行（要確認）
 *   node scripts/prepare-and-send-r2511-thankyou.mjs test EMAIL  # テスト送信
 *
 * Requires .env.local:
 *   GAS_WEBAPP_URL, WIX_API_KEY, WIX_SITE_ID
 */

import { readFileSync } from 'fs'

// Load .env.local manually
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const GAS_URL = process.env.GAS_WEBAPP_URL
const WIX_API_KEY = process.env.WIX_API_KEY
const WIX_SITE_ID = process.env.WIX_SITE_ID
const MODE = process.argv[2] || 'status'
const TEST_EMAIL = process.argv[3] || 'aki@aicu.ai'

const CAMPAIGN_ID = 'R2511-thankyou-R2602'

if (!GAS_URL) { console.error('GAS_WEBAPP_URL not set'); process.exit(1) }

// ─── Wix SDK ───────────────────────────────────────
async function getWixMemberEmails() {
  const { createClient, ApiKeyStrategy } = await import('@wix/sdk')
  const { members } = await import('@wix/members')
  const contactsPublic = await import('@wix/contacts/build/cjs/src/contacts-v4-contact.public.js')

  const client = createClient({
    auth: ApiKeyStrategy({ apiKey: WIX_API_KEY, siteId: WIX_SITE_ID }),
    modules: { members, contacts: contactsPublic },
  })

  // Members APIではemailが取れないので、Contacts APIを使う
  // NOTE: Contacts API pagination is broken with API Key auth (always returns same 50)
  // So we get all we can from first call
  const emails = []

  console.log('[wix] Fetching contacts via Contacts API...')
  try {
    const result = await client.contacts.queryContacts({
      paging: { limit: 1000 },
    })
    const contacts = result.contacts ?? []
    const total = result.pagingMetadata?.total ?? contacts.length
    console.log(`[wix] Contacts: got ${contacts.length} of ${total} total`)

    for (const c of contacts) {
      const email = c.primaryInfo?.email
        || c.info?.emails?.[0]?.email
      if (email) {
        const name = c.info?.name?.first
          || c.primaryInfo?.name?.first
          || ''
        const lastName = c.info?.name?.last
          || c.primaryInfo?.name?.last
          || ''
        emails.push({ email, name, lastName })
      }
    }
  } catch (err) {
    console.error('[wix] Contacts API failed:', err.message)
  }

  // Also try Members API for loginEmail (some may have it)
  if (emails.length < 50) {
    console.log('[wix] Also trying Members API...')
    let offset = 0
    const limit = 100
    while (true) {
      const result = await client.members.queryMembers()
        .limit(limit)
        .skip(offset)
        .find()
      const items = result.items || []
      if (offset === 0) {
        console.log(`[wix] Members totalCount = ${result.totalCount}`)
      }
      for (const member of items) {
        const email = member.loginEmail || member.loginEmailAddress
        if (email && !emails.find(e => e.email === email)) {
          emails.push({ email, name: member.profile?.nickname || '', lastName: '' })
        }
      }
      if (items.length < limit) break
      offset += limit
      if (offset >= 10000) break
    }
  }

  // Deduplicate
  const seen = new Set()
  const unique = emails.filter(e => {
    if (seen.has(e.email.toLowerCase())) return false
    seen.add(e.email.toLowerCase())
    return true
  })

  console.log(`[wix] Total unique emails: ${unique.length}`)
  return unique
}

// ─── GAS API helpers ────────────────────────────────
async function gasPost(body) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'follow',
  })
  return res.json()
}

async function subscribeContact(email, firstName, lastName) {
  return gasPost({
    action: 'subscribe',
    email,
    firstName: firstName || '',
    lastName: lastName || '',
  })
}

async function getAdminStats() {
  return gasPost({ action: 'getAdminStats' })
}

// ─── Main ───────────────────────────────────────────
async function main() {
  console.log(`Mode: ${MODE}\n`)

  if (MODE === 'status') {
    // Show current GAS contact stats
    const stats = await getAdminStats()
    if (stats.success) {
      console.log('GAS Contacts:', JSON.stringify(stats.data.contacts, null, 2))
      console.log('Totals:', JSON.stringify(stats.data.totals, null, 2))
    } else {
      console.error('Failed:', stats.error)
    }
    return
  }

  if (MODE === 'prepare') {
    // Step 1: Fetch Wix members
    if (!WIX_API_KEY || !WIX_SITE_ID) {
      console.error('WIX_API_KEY / WIX_SITE_ID not set in .env.local')
      process.exit(1)
    }

    console.log('1. Fetching Wix member emails...')
    const wixMembers = await getWixMemberEmails()

    console.log(`\n2. Registering ${wixMembers.length} contacts in GAS...`)
    let added = 0, skipped = 0, failed = 0

    for (const { email, name } of wixMembers) {
      try {
        const result = await subscribeContact(email, name, '')
        if (result.success) {
          if (result.message?.includes('Already subscribed')) {
            skipped++
          } else {
            added++
            console.log(`  + ${email}`)
          }
        } else {
          console.log(`  skip: ${email} — ${result.error}`)
          skipped++
        }
      } catch (err) {
        console.error(`  ✗ ${email}: ${err.message}`)
        failed++
      }
      // Small delay to avoid GAS rate limits
      await new Promise(r => setTimeout(r, 200))
    }

    console.log(`\nDone: ${added} added, ${skipped} skipped, ${failed} failed`)

    // Show final stats
    const stats = await getAdminStats()
    if (stats.success) {
      console.log('\nGAS Contacts:', JSON.stringify(stats.data.contacts, null, 2))
    }
    return
  }

  if (MODE === 'test') {
    // Test send
    console.log(`Sending test to ${TEST_EMAIL}...`)
    const result = await gasPost({
      action: 'testSendTo',
      id: CAMPAIGN_ID,
      email: TEST_EMAIL,
    })
    console.log('Result:', JSON.stringify(result, null, 2))
    return
  }

  if (MODE === 'send') {
    // Production send
    const stats = await getAdminStats()
    const contactCount = stats.data?.contacts?.subscribed || 0
    console.log(`⚠️  PRODUCTION SEND to ${contactCount} subscribed contacts`)
    console.log(`Campaign: ${CAMPAIGN_ID}`)

    const readline = await import('readline')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise(resolve => {
      rl.question(`Type "YES" to send to ${contactCount} contacts: `, resolve)
    })
    rl.close()

    if (answer !== 'YES') {
      console.log('Cancelled.')
      return
    }

    console.log('\nSending campaign...')
    const result = await gasPost({
      action: 'sendCampaign',
      id: CAMPAIGN_ID,
    })
    console.log('Result:', JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('\n✓ Campaign sent!')
    } else {
      console.error('\n✗ Failed:', result.error)
    }
    return
  }

  console.error(`Unknown mode: ${MODE}. Use prepare/status/test/send`)
}

main().catch(console.error)
