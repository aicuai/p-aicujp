#!/usr/bin/env node
/**
 * export-survey-data.mjs — survey_responses を CSV エクスポート
 *
 * Usage:
 *   node scripts/export-survey-data.mjs                # 全サーベイ
 *   node scripts/export-survey-data.mjs R2602          # R2602のみ
 *   node scripts/export-survey-data.mjs R2511          # R2511のみ
 *
 * Output: tmp/survey-{surveyId}-{date}.csv (gitignored)
 *
 * Requires .env.local:
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_KEY
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, writeFileSync, mkdirSync } from "fs"

// Load .env.local manually (no dotenv dependency)
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const TARGET_SURVEY = process.argv[2] || null // null = all

async function main() {
  const surveys = TARGET_SURVEY ? [TARGET_SURVEY] : ["R2511", "R2602"]

  mkdirSync("tmp", { recursive: true })

  for (const surveyId of surveys) {
    console.log(`\nExporting ${surveyId}...`)

    let query = supabase
      .from("survey_responses")
      .select("id, survey_id, email, submitted_at, reward_status, reward_confirmed_at, is_test, answers, ip_hash")
      .eq("survey_id", surveyId)
      .order("submitted_at", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching ${surveyId}:`, error)
      continue
    }

    if (!data || data.length === 0) {
      console.log(`  No records found for ${surveyId}`)
      continue
    }

    console.log(`  Found ${data.length} records (test: ${data.filter(r => r.is_test).length})`)

    // Collect all answer keys across all responses
    const answerKeys = new Set()
    for (const row of data) {
      if (row.answers && typeof row.answers === "object") {
        for (const key of Object.keys(row.answers)) {
          answerKeys.add(key)
        }
      }
    }
    const sortedKeys = [...answerKeys].sort()

    // Build CSV
    const metaCols = ["id", "survey_id", "email", "submitted_at", "reward_status", "reward_confirmed_at", "is_test", "ip_hash"]
    const header = [...metaCols, ...sortedKeys]

    const rows = data.map(row => {
      const meta = metaCols.map(col => csvEscape(row[col] ?? ""))
      const answers = sortedKeys.map(key => {
        const val = row.answers?.[key]
        if (Array.isArray(val)) return csvEscape(val.join("; "))
        return csvEscape(val ?? "")
      })
      return [...meta, ...answers].join(",")
    })

    // Add BOM for Excel compatibility
    const csv = "\ufeff" + header.join(",") + "\n" + rows.join("\n") + "\n"
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const filename = `tmp/survey-${surveyId}-${date}.csv`

    writeFileSync(filename, csv, "utf8")
    console.log(`  Saved: ${filename} (${data.length} rows, ${sortedKeys.length} answer columns)`)

    // Summary
    const withEmail = data.filter(r => r.email && !r.is_test)
    const confirmed = data.filter(r => r.reward_status === "confirmed" && !r.is_test)
    const pending = data.filter(r => r.reward_status === "pending" && !r.is_test)
    const valid = data.filter(r => !r.is_test)

    console.log(`  Summary (excluding test):`)
    console.log(`    Valid responses: ${valid.length}`)
    console.log(`    With email: ${withEmail.length}`)
    console.log(`    Reward confirmed: ${confirmed.length}`)
    console.log(`    Reward pending: ${pending.length}`)
  }
}

function csvEscape(val) {
  const s = String(val)
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

main().catch(err => {
  console.error("Fatal:", err)
  process.exit(1)
})
