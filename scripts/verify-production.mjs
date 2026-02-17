/**
 * 本番データ検証スクリプト
 *
 * 管理者ダッシュボードと同じデータソース (Supabase + Wix) を直接クエリし、
 * 期待値と照合する。ブラウザログイン不要。
 *
 * Usage: node scripts/verify-production.mjs
 *
 * セキュリティ: .env.local の認証情報を使用（ローカル実行のみ）
 */

import fs from 'fs';
import { createClient, ApiKeyStrategy } from '@wix/sdk';
import { members } from '@wix/members';
import { orders, plans } from '@wix/pricing-plans';
import { accounts } from '@wix/loyalty';
import * as contactsPublic from '@wix/contacts/build/cjs/src/contacts-v4-contact.public.js';
import { createClient as createSupa } from '@supabase/supabase-js';

// ── Load env ──
const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const l of lines) {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

// ── Clients ──
const wix = createClient({
  auth: ApiKeyStrategy({ apiKey: env.WIX_API_KEY, siteId: env.WIX_SITE_ID }),
  modules: { contacts: contactsPublic, members, accounts, orders, plans },
});
const supa = createSupa(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

// ── Test helpers ──
let passed = 0;
let failed = 0;
const results = [];

function check(name, actual, expected, comparator = 'eq') {
  let ok = false;
  if (comparator === 'eq') ok = actual === expected;
  else if (comparator === 'gte') ok = actual >= expected;
  else if (comparator === 'gt') ok = actual > 0;
  else if (comparator === 'type') ok = typeof actual === expected;

  if (ok) {
    passed++;
    results.push({ status: 'PASS', name, actual });
  } else {
    failed++;
    results.push({ status: 'FAIL', name, actual, expected, comparator });
  }
}

// ── Run tests ──
console.log('Verifying production data...\n');

// 1. Wix Members
const membersResult = await wix.members.queryMembers().limit(1).find();
const wixMembers = membersResult.totalCount ?? 0;
check('Wix サイト会員数', wixMembers, 452, 'gte');

// 2. Wix Contacts
const contactsResult = await wix.contacts.queryContacts({ paging: { limit: 1 } });
const wixContacts = contactsResult.pagingMetadata?.total ?? 0;
check('Wix 連絡先数', wixContacts, wixMembers, 'gte');
check('連絡先 > 会員（差分あり）', wixContacts - wixMembers, 0, 'gte');

// 3. Supabase unified_users
const { count: totalUsers } = await supa.from('unified_users').select('id', { count: 'exact', head: true });
check('unified_users 存在', totalUsers, 0, 'gt');

// 4. Supabase wix_linked
const { count: wixLinked } = await supa.from('unified_users').select('id', { count: 'exact', head: true }).not('wix_contact_id', 'is', null);
check('Wix紐付けユーザー存在', wixLinked, 0, 'gt');

// 5. Supabase profiles
const { count: profilesCount } = await supa.from('profiles').select('id', { count: 'exact', head: true });
check('profiles テーブル応答', profilesCount, 'number', 'type');

// 6. Supabase push_subscriptions
const { count: pushCount } = await supa.from('push_subscriptions').select('user_id', { count: 'exact', head: true });
check('push_subscriptions テーブル応答', pushCount, 'number', 'type');

// 7. Login activity
const { count: login7d } = await supa.from('unified_users').select('id', { count: 'exact', head: true })
  .gte('last_login_at', new Date(Date.now() - 7 * 86400000).toISOString());
check('7日アクティブ応答', login7d, 'number', 'type');

// 8. Wix Pricing Plans
const plansResult = await wix.plans.queryPublicPlans().find();
const planNames = (plansResult.items || []).map(p => p.name);
check('プラン数', planNames.length, 4, 'eq');
check('Freeプラン存在', planNames.some(n => n?.includes('Free')), true, 'eq');
check('Lab+プラン存在', planNames.some(n => n?.includes('Lab+')), true, 'eq');

// 9. Subscription orders
const ordersResult = await wix.orders.managementListOrders();
const allOrders = ordersResult.orders || [];
const activeOrders = allOrders.filter(o => o.status === 'ACTIVE');
const canceledOrders = allOrders.filter(o => o.status === 'CANCELED');
check('サブスクリプション取得', allOrders.length, 0, 'gt');
check('アクティブサブスク存在', activeOrders.length, 0, 'gt');

// 10. Production API endpoint (unauthenticated = 401)
try {
  const r = await fetch('https://p.aicu.jp/api/admin/stats');
  const body = await r.json();
  check('Admin API 認証なし → 401', r.status, 401, 'eq');
} catch {
  check('Admin API 到達可能', false, true, 'eq');
}

// 11. GA4 tag check
try {
  const r = await fetch('https://p.aicu.jp/');
  const html = await r.text();
  check('GA4 タグ埋め込み', html.includes('G-9Z2S3ZBGEV'), true, 'eq');
} catch {
  check('p.aicu.jp 到達可能', false, true, 'eq');
}

// ── Report ──
console.log('─'.repeat(60));
for (const r of results) {
  const icon = r.status === 'PASS' ? 'OK' : 'NG';
  const detail = r.status === 'FAIL' ? ` (got: ${r.actual}, want: ${r.comparator} ${r.expected})` : ` → ${r.actual}`;
  console.log(`[${icon}] ${r.name}${detail}`);
}
console.log('─'.repeat(60));
console.log(`\nResult: ${passed} passed, ${failed} failed, ${passed + failed} total`);

if (failed > 0) process.exit(1);
