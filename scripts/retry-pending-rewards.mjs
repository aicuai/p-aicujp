#!/usr/bin/env node
/**
 * retry-pending-rewards.mjs
 *
 * Retries all survey responses with reward_status = "pending"
 * by directly calling Wix SDK to award loyalty points.
 *
 * Usage:
 *   node scripts/retry-pending-rewards.mjs          # dry run
 *   node scripts/retry-pending-rewards.mjs --send   # actually award points
 */

import { readFileSync } from "fs"
import { createHash } from "crypto"

// Load .env.local
const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const DRY_RUN = !process.argv.includes("--send")

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_KEY not set")
  process.exit(1)
}

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  })
  return res.json()
}

async function supabasePatch(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(data),
  })
  return res.ok
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "PRODUCTION"}\n`)

  // Dynamic import of Wix SDK
  const { createClient, ApiKeyStrategy } = await import("@wix/sdk")
  const { members } = await import("@wix/members")
  const loyaltyPkg = await import("@wix/loyalty")
  const contactsPublic = await import(
    "@wix/contacts/build/cjs/src/contacts-v4-contact.public.js"
  )

  const client = createClient({
    auth: ApiKeyStrategy({
      apiKey: process.env.WIX_API_KEY,
      siteId: process.env.WIX_SITE_ID,
    }),
    modules: {
      contacts: contactsPublic,
      members,
      accounts: loyaltyPkg.accounts,
      transactions: loyaltyPkg.transactions,
    },
  })

  // Fetch pending or failed responses
  const includeFailed = process.argv.includes("--include-failed")
  const statusFilter = includeFailed
    ? "reward_status=in.(pending,failed)"
    : "reward_status=eq.pending"
  const rows = await supabaseGet(
    `survey_responses?select=id,survey_id,email,reward_status,submitted_at&${statusFilter}&order=submitted_at.asc`
  )

  console.log(`Found ${rows.length} pending responses\n`)

  let ok = 0, failed = 0

  for (const row of rows) {
    const { id, survey_id, email } = row
    if (!email) { console.log(`  skip: ${id} (no email)`); continue }

    const idempotencyKey = createHash("sha256")
      .update(email + survey_id)
      .digest("hex")
      .slice(0, 16)
    const description = `${survey_id}調査謝礼`
    const points = 10000

    console.log(`  ${email.slice(0, 12)}*** (${survey_id})`)

    if (DRY_RUN) {
      console.log(`    → [DRY RUN] would award ${points}pt`)
      continue
    }

    try {
      // 1. Find or create contact
      let contactResult = await client.contacts.queryContacts({ search: email })
      let contacts = contactResult.contacts ?? contactResult.items ?? []
      let contact = contacts[0]

      if (!contact) {
        console.log(`    → Creating contact via REST API...`)
        const res = await fetch("https://www.wixapis.com/contacts/v4/contacts", {
          method: "POST",
          headers: {
            Authorization: process.env.WIX_API_KEY,
            "wix-site-id": process.env.WIX_SITE_ID,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            info: { emails: { items: [{ email }] } },
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(JSON.stringify(data))
        contact = data?.contact ?? null
      }

      const contactId = contact?._id ?? contact?.id ?? contact?.contactId
      if (!contactId) throw new Error("No contactId")
      console.log(`    → contactId: ${contactId}`)

      // 2. Find or create loyalty account
      let account
      const acctResult = await client.accounts.getAccountBySecondaryId({ contactId })
      account = acctResult?.account ?? acctResult
      let accountId = account?._id ?? account?.id ?? account?.accountId

      if (!accountId) {
        console.log(`    → Creating loyalty account via REST...`)
        const acctRes = await fetch("https://www.wixapis.com/loyalty-accounts/v1/accounts", {
          method: "POST",
          headers: {
            Authorization: process.env.WIX_API_KEY,
            "wix-site-id": process.env.WIX_SITE_ID,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ contactId }),
        })
        const acctData = await acctRes.json()
        account = acctData?.account ?? null
        accountId = account?.id ?? account?._id
      }
      if (!accountId) throw new Error("No accountId")
      console.log(`    → accountId: ${accountId}`)

      // 3. Earn points
      try {
        await client.accounts.earnPoints(accountId, {
          amount: points,
          appId: "p-aicujp-survey",
          idempotencyKey,
          description,
        })
        console.log(`    → OK: +${points}pt`)
      } catch (earnErr) {
        // Idempotency duplicate = already awarded → treat as success
        if (earnErr.message?.includes("TRANSACTION_ALREADY_EXISTS")) {
          console.log(`    → Already awarded (idempotency key match) — marking confirmed`)
        } else {
          throw earnErr
        }
      }

      // 4. Update status
      await supabasePatch("survey_responses", id, {
        reward_status: "confirmed",
        reward_confirmed_at: new Date().toISOString(),
      })

      ok++
    } catch (e) {
      console.error(`    → FAIL: ${e.message}`)
      await supabasePatch("survey_responses", id, { reward_status: "failed" })
      failed++
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log(`\nDone: ${ok} awarded, ${failed} failed, ${rows.length - ok - failed} skipped`)
}

main().catch(console.error)
