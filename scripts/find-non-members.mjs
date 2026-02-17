import fs from 'fs';
import { createClient, ApiKeyStrategy } from '@wix/sdk';
import { members } from '@wix/members';

const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const l of lines) {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

// REST API for contacts (SDK pagination is broken)
async function queryContactsREST(cursorOrOffset) {
  const body = typeof cursorOrOffset === 'string'
    ? { cursorPaging: { limit: 100, cursor: cursorOrOffset } }
    : { paging: { limit: 100, offset: cursorOrOffset || 0 } };

  const r = await fetch('https://www.wixapis.com/contacts/v4/contacts/query', {
    method: 'POST',
    headers: {
      'Authorization': env.WIX_API_KEY,
      'wix-site-id': env.WIX_SITE_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function getAllContactsREST() {
  const all = [];
  let cursor = null;
  let page = 0;
  while (true) {
    const r = cursor ? await queryContactsREST(cursor) : await queryContactsREST(0);
    const items = r.contacts || [];
    all.push(...items);
    page++;
    console.log(`Page ${page}: ${items.length} contacts (total: ${all.length})`);

    const next = r.pagingMetadata?.cursors?.next;
    if (!next || items.length === 0) break;
    cursor = next;
  }
  return all;
}

// Members via SDK (works fine)
const wix = createClient({
  auth: ApiKeyStrategy({ apiKey: env.WIX_API_KEY, siteId: env.WIX_SITE_ID }),
  modules: { members },
});

async function getAllMembers() {
  const all = [];
  let result = await wix.members.queryMembers().limit(100).find();
  all.push(...(result.items || []));
  while (result.hasNext && result.hasNext()) {
    result = await result.next();
    all.push(...(result.items || []));
  }
  return all;
}

// Filter contacts that do NOT have memberInfo (= non-members)
// Since pagination is broken at 50, use filter approach
async function queryContactsFiltered(filter) {
  const r = await fetch('https://www.wixapis.com/contacts/v4/contacts/query', {
    method: 'POST',
    headers: {
      'Authorization': env.WIX_API_KEY,
      'wix-site-id': env.WIX_SITE_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paging: { limit: 50 }, ...filter }),
  });
  return r.json();
}

// Method 1: Check source types that are NOT WIX_SITE_MEMBERS
const sources = ['WIX_STORES', 'WIX_APP', 'IMPORT', 'OTHER', 'THIRD_PARTY', 'WIX_BOOKINGS', 'WIX_EVENTS', 'WIX_FORMS'];
console.log('Searching non-member contacts by source type...\n');

const nonMembers = [];
for (const src of sources) {
  const r = await queryContactsFiltered({
    filter: { 'source.sourceType': { '$eq': src } }
  });
  const items = r.contacts || [];
  if (items.length > 0) {
    console.log(`Source ${src}: ${items.length} contacts (total matching: ${r.pagingMetadata?.total || '?'})`);
    nonMembers.push(...items);
  }
}

// Also check the first 50 for contacts without memberInfo
const allFirst50 = await queryContactsREST(0);
const noMemberInfo = (allFirst50.contacts || []).filter(c => !c.memberInfo);
console.log(`\nFirst 50 contacts without memberInfo: ${noMemberInfo.length}`);

console.log(`\n=== Non-member contacts found: ${nonMembers.length} ===\n`);

for (const c of nonMembers) {
  const info = c.info || {};
  const emails = Array.isArray(info.emails) ? info.emails.map(e => e.email).join(', ') : (c.primaryEmail || '');
  const nameObj = info.name || {};
  const name = [nameObj.first, nameObj.last].filter(Boolean).join(' ') || '(no name)';
  const source = c.source?.sourceType || '?';
  const created = (c.createdDate || '?').toString().slice(0, 10);
  console.log(`${name} | ${emails || '(no email)'} | source: ${source} | ${created}`);
}
