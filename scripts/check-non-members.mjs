import fs from 'fs';
import { createClient, ApiKeyStrategy } from '@wix/sdk';
import { members } from '@wix/members';
import * as contactsPublic from '@wix/contacts/build/cjs/src/contacts-v4-contact.public.js';

const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const l of lines) {
  const m = l.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const wix = createClient({
  auth: ApiKeyStrategy({ apiKey: env.WIX_API_KEY, siteId: env.WIX_SITE_ID }),
  modules: { contacts: contactsPublic, members },
});

async function getAllContacts() {
  const all = [];
  let cursor = undefined;
  let page = 0;
  while (true) {
    const params = cursor
      ? { cursorPaging: { limit: 50, cursor } }
      : { paging: { limit: 50, offset: 0 } };
    const r = await wix.contacts.queryContacts(params);
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

const [contacts, membersList] = await Promise.all([getAllContacts(), getAllMembers()]);
console.log(`\nTotal Contacts: ${contacts.length} / Total Members: ${membersList.length}`);

const memberContactIds = new Set(membersList.map(m => m.contactId).filter(Boolean));
const nonMembers = contacts.filter(c => !memberContactIds.has(c._id));
console.log(`\n=== Non-member contacts: ${nonMembers.length} ===\n`);

for (const c of nonMembers) {
  const emails = (c.emails || []).map(e => e.email).join(', ');
  const phones = (c.phones || []).map(p => p.phone).join(', ');
  const name = [c.name?.first, c.name?.last].filter(Boolean).join(' ') || '(no name)';
  const source = c.source?.sourceType || '?';
  const created = c._createdDate ? new Date(c._createdDate).toISOString().slice(0, 10) : '?';
  console.log(`${name} | ${emails || '(no email)'} | ${phones || ''} | source: ${source} | created: ${created}`);
}
