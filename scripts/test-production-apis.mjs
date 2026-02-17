/**
 * 本番 API テストスクリプト
 *
 * メール購読 / 解除 / イベントリアクション / mailnews ページの
 * エンドツーエンドテストを本番環境で実行する。
 *
 * Usage:
 *   node scripts/test-production-apis.mjs                    # 本番 (p.aicu.jp)
 *   node scripts/test-production-apis.mjs --local            # ローカル (localhost:3200)
 *   node scripts/test-production-apis.mjs --email test@x.com # テスト用メール指定
 *   node scripts/test-production-apis.mjs --keep             # テストデータを残す
 *
 * テストデータは最後にクリーンアップされる（--keep で残す）
 */

import fs from "fs";
import { createClient as createSupa } from "@supabase/supabase-js";

// ── Config ──
const args = process.argv.slice(2);
const isLocal = args.includes("--local");
const keepData = args.includes("--keep");
const emailIdx = args.indexOf("--email");
const emailArg = args.find((a) => a.startsWith("--email="))?.split("=")[1]
  || (emailIdx >= 0 ? args[emailIdx + 1] : undefined);

const BASE_URL = isLocal ? "http://localhost:3200" : "https://p.aicu.jp";
const TEST_EMAIL = emailArg || `test-api-${Date.now()}@test.aicu.jp`;
const TEST_EVENT = "Fes26Halu";
const TEST_SESSION = `test_session_${Date.now()}`;

// ── Load env ──
let env = {};
try {
  const lines = fs.readFileSync(".env.local", "utf8").split("\n");
  for (const l of lines) {
    const m = l.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
} catch {
  console.error("Warning: .env.local not found (Supabase直接検証はスキップ)");
}

const supa =
  env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY
    ? createSupa(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
    : null;

// ── Test framework ──
let passed = 0;
let failed = 0;
const results = [];

function check(name, actual, expected, comparator = "eq") {
  let ok = false;
  if (comparator === "eq") ok = actual === expected;
  else if (comparator === "gte") ok = actual >= expected;
  else if (comparator === "gt") ok = actual > 0;
  else if (comparator === "truthy") ok = !!actual;
  else if (comparator === "includes") ok = String(actual).includes(expected);

  if (ok) {
    passed++;
    results.push({ status: "PASS", name, actual });
  } else {
    failed++;
    results.push({ status: "FAIL", name, actual, expected, comparator });
  }
  return ok;
}

async function apiCall(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

// ── Tests ──
console.log(`\n  Production API Test`);
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  Test email: ${TEST_EMAIL}`);
console.log(`${"─".repeat(60)}\n`);

// ============================================================
// 1. テーブル存在確認 (Supabase 直接)
// ============================================================
console.log("## 1. Supabase テーブル確認\n");

if (supa) {
  const { count: mailSubCount, error: e1 } = await supa
    .from("mail_subscribers")
    .select("id", { count: "exact", head: true });
  check(
    "mail_subscribers テーブル存在",
    e1 === null,
    true,
    "eq"
  );

  const { count: eventReactCount, error: e2 } = await supa
    .from("event_reactions")
    .select("id", { count: "exact", head: true });
  check(
    "event_reactions テーブル存在",
    e2 === null,
    true,
    "eq"
  );
} else {
  console.log("  (Supabase 直接確認スキップ — .env.local 不足)\n");
}

// ============================================================
// 2. メール購読 API
// ============================================================
console.log("\n## 2. メール購読 (POST /api/mail/subscribe)\n");

// 2a. バリデーション: メール無し
{
  const { status, data } = await apiCall("POST", "/api/mail/subscribe", {});
  check("購読: メール無し → 400", status, 400);
}

// 2b. バリデーション: 不正メール
{
  const { status } = await apiCall("POST", "/api/mail/subscribe", {
    email: "not-an-email",
  });
  check("購読: 不正メール → 400", status, 400);
}

// 2c. 正常登録
let subscribeResult;
{
  const { status, data } = await apiCall("POST", "/api/mail/subscribe", {
    email: TEST_EMAIL,
    event: TEST_EVENT,
    categories: ["events", "news"],
    lang: "ja",
    source: "api_test",
  });
  subscribeResult = data;
  check("購読: 正常登録 → 200", status, 200);
  check("購読: action = subscribed", data?.action, "subscribed");
  check("購読: events 含む", data?.events?.includes(TEST_EVENT), true, "eq");
  check(
    "購読: categories 含む",
    data?.categories?.includes("events") && data?.categories?.includes("news"),
    true,
    "eq"
  );
}

// 2d. Supabase で直接確認
let testSubscriberId;
let unsubToken;
if (supa) {
  const { data: row } = await supa
    .from("mail_subscribers")
    .select("id, email, status, events, categories, unsub_token, source")
    .eq("email", TEST_EMAIL)
    .single();

  check("DB: レコード作成済み", !!row, true, "eq");
  check("DB: status = active", row?.status, "active");
  check("DB: source = api_test", row?.source, "api_test");
  check("DB: unsub_token 生成済み", !!row?.unsub_token, true, "eq");

  testSubscriberId = row?.id;
  unsubToken = row?.unsub_token;
}

// 2e. 重複登録 → updated
{
  const { status, data } = await apiCall("POST", "/api/mail/subscribe", {
    email: TEST_EMAIL,
    categories: ["products"],
    lang: "ja",
  });
  check("購読: 重複 → 200", status, 200);
  check("購読: action = updated", data?.action, "updated");
  check(
    "購読: products カテゴリ追加",
    data?.categories?.includes("products"),
    true,
    "eq"
  );
}

// ============================================================
// 3. メール購読解除 API
// ============================================================
console.log("\n## 3. メール購読解除 (POST /api/mail/unsubscribe)\n");

// 3a. トークン無し
{
  const { status } = await apiCall("POST", "/api/mail/unsubscribe", {});
  check("解除: トークン無し → 400", status, 400);
}

// 3b. 不正トークン
{
  const { status } = await apiCall("POST", "/api/mail/unsubscribe", {
    token: "invalid_token_12345",
  });
  check("解除: 不正トークン → 404", status, 404);
}

// 3c. 正常解除 (トークンがある場合のみ)
if (unsubToken) {
  const { status, data } = await apiCall("POST", "/api/mail/unsubscribe", {
    token: unsubToken,
    email: TEST_EMAIL,
  });
  check("解除: 正常 → 200", status, 200);
  check("解除: action = unsubscribed", data?.action, "unsubscribed");

  // DB 確認
  if (supa) {
    const { data: row } = await supa
      .from("mail_subscribers")
      .select("status, unsubscribed_at")
      .eq("id", testSubscriberId)
      .single();
    check("DB: status = unsubscribed", row?.status, "unsubscribed");
    check("DB: unsubscribed_at 設定済み", !!row?.unsubscribed_at, true, "eq");
  }

  // 3d. 冪等性: 再度解除しても成功
  {
    const { status, data } = await apiCall("POST", "/api/mail/unsubscribe", {
      token: unsubToken,
    });
    check("解除: 冪等性 → 200", status, 200);
    check(
      "解除: action = already_unsubscribed",
      data?.action,
      "already_unsubscribed"
    );
  }

  // 3e. 再購読
  {
    const { status, data } = await apiCall("POST", "/api/mail/subscribe", {
      email: TEST_EMAIL,
      lang: "ja",
    });
    check("再購読: → 200", status, 200);
    check("再購読: action = resubscribed", data?.action, "resubscribed");
  }
} else {
  console.log("  (unsub_token 取得不可 — 解除テストスキップ)\n");
}

// ============================================================
// 4. イベントリアクション API
// ============================================================
console.log("\n## 4. イベントリアクション (/api/event/react)\n");

// 4a. POST: バリデーション
{
  const { status } = await apiCall("POST", "/api/event/react", {});
  check("リアクション: パラメータ無し → 400", status, 400);
}

// 4b. POST: 不正アクション
{
  const { status } = await apiCall("POST", "/api/event/react", {
    event: TEST_EVENT,
    session: TEST_SESSION,
    action: "invalid",
  });
  check("リアクション: 不正アクション → 400", status, 400);
}

// 4c. POST: 正常投票
{
  const { status, data } = await apiCall("POST", "/api/event/react", {
    event: TEST_EVENT,
    session: TEST_SESSION,
    action: "like",
  });
  check("リアクション: like → 200", status, 200);
  check("リアクション: ok = true", data?.ok, true);
  check("リアクション: like count >= 1", data?.counts?.like >= 1, true, "eq");
}

// 4d. POST: 重複投票 (同じ IP → 既存と同じカウント)
{
  const { status, data } = await apiCall("POST", "/api/event/react", {
    event: TEST_EVENT,
    session: TEST_SESSION,
    action: "like",
  });
  check("リアクション: 重複投票 → 200 (冪等)", status, 200);
}

// 4e. POST: want_video
{
  const { status, data } = await apiCall("POST", "/api/event/react", {
    event: TEST_EVENT,
    session: TEST_SESSION,
    action: "want_video",
  });
  check("リアクション: want_video → 200", status, 200);
}

// 4f. GET: 集計
{
  const { status, data } = await apiCall("GET", `/api/event/react?event=${TEST_EVENT}`);
  check("リアクション GET: → 200", status, 200);
  check("リアクション GET: counts 存在", !!data?.counts, true, "eq");
  check(
    "リアクション GET: テストセッション含む",
    !!data?.counts?.[TEST_SESSION],
    true,
    "eq"
  );
}

// 4g. GET: event パラメータ無し
{
  const { status } = await apiCall("GET", "/api/event/react");
  check("リアクション GET: パラメータ無し → 400", status, 400);
}

// ============================================================
// 5. Mailnews ページ
// ============================================================
console.log("\n## 5. Mailnews ページ\n");

{
  const res = await fetch(`${BASE_URL}/mailnews?email=test@example.com&token=dummy`);
  check("mailnews ページ: → 200", res.status, 200);
  const html = await res.text();
  check("mailnews ページ: HTML レンダリング", html.includes("</html>"), true, "eq");
}

// ============================================================
// 6. Mailnews unsubscribe proxy
// ============================================================
console.log("\n## 6. Mailnews GAS プロキシ\n");

{
  // バリデーションのみ (GAS に実際にリクエストしない)
  const { status, data } = await apiCall("POST", "/api/mailnews/unsubscribe", {});
  check(
    "GAS プロキシ: パラメータ無し → 400",
    status,
    400
  );
}

// ============================================================
// 7. CORS ヘッダー確認
// ============================================================
console.log("\n## 7. CORS ヘッダー\n");

{
  const res = await fetch(`${BASE_URL}/api/mail/subscribe`, {
    method: "OPTIONS",
  });
  check("CORS: mail/subscribe OPTIONS → 204", res.status, 204);
}

{
  const res = await fetch(`${BASE_URL}/api/event/react`, {
    method: "OPTIONS",
  });
  check("CORS: event/react OPTIONS → 204", res.status, 204);
}

// ============================================================
// Cleanup
// ============================================================
console.log("\n## Cleanup\n");

if (keepData) {
  console.log(`  --keep 指定: テストデータを残します (email: ${TEST_EMAIL})\n`);
} else if (supa) {
  // テストメール購読者を削除
  const { error: delSub } = await supa
    .from("mail_subscribers")
    .delete()
    .eq("email", TEST_EMAIL);
  check("Cleanup: mail_subscribers 削除", !delSub, true, "eq");

  // テストセッションのリアクション削除
  const { error: delReact } = await supa
    .from("event_reactions")
    .delete()
    .eq("session_id", TEST_SESSION);
  check("Cleanup: event_reactions 削除", !delReact, true, "eq");

  console.log(`  テストデータ削除完了\n`);
} else {
  console.log("  (Supabase 接続なし — テストデータの手動削除が必要)\n");
  console.log(`  テストメール: ${TEST_EMAIL}`);
  console.log(`  テストセッション: ${TEST_SESSION}\n`);
}

// ============================================================
// Report
// ============================================================
console.log("═".repeat(60));
for (const r of results) {
  const icon = r.status === "PASS" ? "OK" : "NG";
  const detail =
    r.status === "FAIL"
      ? ` (got: ${JSON.stringify(r.actual)}, want: ${r.comparator} ${JSON.stringify(r.expected)})`
      : "";
  console.log(`  [${icon}] ${r.name}${detail}`);
}
console.log("═".repeat(60));
console.log(
  `\n  Result: ${passed} passed, ${failed} failed, ${passed + failed} total\n`
);

if (failed > 0) process.exit(1);
