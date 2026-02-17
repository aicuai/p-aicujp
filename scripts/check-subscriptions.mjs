import fs from 'fs';
import { createClient, ApiKeyStrategy } from '@wix/sdk';
import { orders, plans } from '@wix/pricing-plans';

const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const l of lines) {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const wix = createClient({
  auth: ApiKeyStrategy({ apiKey: env.WIX_API_KEY, siteId: env.WIX_SITE_ID }),
  modules: { orders, plans },
});

// 1. List all pricing plans
console.log('=== Pricing Plans ===\n');
try {
  const plansResult = await wix.plans.queryPublicPlans().find();
  for (const p of plansResult.items || []) {
    console.log(`${p.name} | slug: ${p.slug} | id: ${p._id}`);
    console.log(`  pricing: ${JSON.stringify(p.pricing)}`);
    console.log(`  perks: ${(p.perks?.values || []).join(', ')}`);
    console.log();
  }
  console.log(`Total plans: ${plansResult.items?.length || 0}\n`);
} catch (e) {
  console.error('Plans error:', e.message);
}

// 2. List all orders (subscriptions)
console.log('=== Orders (Subscriptions) ===\n');
try {
  const ordersResult = await wix.orders.managementListOrders();
  const items = ordersResult.orders || [];
  console.log(`Total orders: ${items.length}\n`);

  // Group by status
  const byStatus = {};
  for (const o of items) {
    const s = o.status || 'UNKNOWN';
    if (!byStatus[s]) byStatus[s] = [];
    byStatus[s].push(o);
  }

  for (const [status, list] of Object.entries(byStatus)) {
    console.log(`--- ${status}: ${list.length} ---`);
    for (const o of list) {
      const buyer = o.buyer || {};
      const name = buyer.contactId || buyer.memberId || '?';
      const planName = o.planName || o.planId || '?';
      const start = o.startDate ? new Date(o.startDate).toISOString().slice(0, 10) : '?';
      const end = o.endDate ? new Date(o.endDate).toISOString().slice(0, 10) : 'ongoing';
      console.log(`  ${planName} | buyer: ${name} | ${start} → ${end}`);
    }
    console.log();
  }
} catch (e) {
  console.error('Orders error:', e.message);
  // Try REST API directly
  console.log('\nTrying REST API...');
  try {
    const r = await fetch('https://www.wixapis.com/pricing-plans/v2/orders', {
      method: 'POST',
      headers: {
        'Authorization': env.WIX_API_KEY,
        'wix-site-id': env.WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data = await r.json();
    console.log('REST response:', JSON.stringify(data, null, 2).slice(0, 2000));
  } catch (e2) {
    console.error('REST error:', e2.message);
  }
}
