/**
 * Migrate multi_choice → single_choice for specified question IDs.
 * Takes the first element of any array answer.
 *
 * Usage: node scripts/migrate-multi-to-single.mjs
 * Requires .env.local with SUPABASE_URL and SUPABASE_SERVICE_KEY
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

// Parse .env.local manually (no dotenv dependency)
const envContent = readFileSync(".env.local", "utf-8")
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const FIELDS_TO_CONVERT = [
  "entry_1228619554", // AI関係性
  "entry_885269464",  // セクター
]

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
  )

  const { data: rows, error } = await supabase
    .from("survey_responses")
    .select("id, answers")
    .eq("survey_id", "R2602")

  if (error) { console.error("Fetch error:", error); process.exit(1) }
  console.log(`Found ${rows.length} R2602 responses`)

  let updated = 0
  for (const row of rows) {
    const answers = { ...row.answers }
    let changed = false

    for (const field of FIELDS_TO_CONVERT) {
      const val = answers[field]
      if (Array.isArray(val)) {
        answers[field] = val[0] ?? null  // Take first element
        changed = true
        console.log(`  ${row.id}: ${field} [${val.join(", ")}] → "${answers[field]}"`)
      }
    }

    if (changed) {
      const { error: updateErr } = await supabase
        .from("survey_responses")
        .update({ answers })
        .eq("id", row.id)

      if (updateErr) {
        console.error(`  ERROR updating ${row.id}:`, updateErr)
      } else {
        updated++
      }
    }
  }

  console.log(`\nDone. Updated ${updated}/${rows.length} rows.`)
}

main()
