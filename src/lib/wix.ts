import { createClient, ApiKeyStrategy } from "@wix/sdk"
import { members } from "@wix/members"
import { accounts, transactions } from "@wix/loyalty"
import { orders, plans } from "@wix/pricing-plans"
import * as contactsPublic from "@wix/contacts/build/cjs/src/contacts-v4-contact.public"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _wixClient: any = null

function getWixClient() {
  if (!_wixClient) {
    _wixClient = createClient({
      auth: ApiKeyStrategy({
        apiKey: process.env.WIX_API_KEY!,
        siteId: process.env.WIX_SITE_ID!,
      }),
      modules: {
        contacts: contactsPublic,
        members,
        accounts,
        transactions,
        orders,
        plans,
      },
    })
  }
  return _wixClient
}

/** Wix Contact の総数を取得 */
export async function getTotalContactsCount(): Promise<number> {
  const result = await getWixClient().contacts.queryContacts({ paging: { limit: 1 } })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (result as any).pagingMetadata
  return meta?.total ?? meta?.count ?? 0
}

/** Wix サイト会員の総数を取得 */
export async function getTotalMembersCount(): Promise<number> {
  const result = await getWixClient().members.queryMembers().limit(1).find()
  return result.totalCount ?? result.items?.length ?? 0
}

/** メールアドレスで Wix Contact を検索 */
export async function getContactByEmail(email: string) {
  // queryContacts の search はメール完全一致検索に対応
  const result = await getWixClient().contacts.queryContacts({
    search: email,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contacts = (result as any).contacts ?? (result as any).items ?? []
  return contacts[0] ?? null
}

/** contactId から Wix Member を取得 */
export async function getMemberByContactId(contactId: string) {
  const result = await getWixClient().members.queryMembers()
    .eq("contactId", contactId)
    .find()
  return result.items?.[0] ?? null
}

// ─── Subscription types ───
export type WixSubscription = {
  planName: string
  status: string
  startDate: string | null
  endDate: string | null
}

/** memberId で現在のアクティブなサブスクリプションを取得 */
export async function getActiveSubscriptions(memberId: string): Promise<WixSubscription[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (getWixClient().orders as any).managementListOrders({
    buyerIds: [memberId],
    orderStatuses: ["ACTIVE"],
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (result.orders || []).map((o: any) => ({
    planName: o.planName ?? "?",
    status: o.status ?? "UNKNOWN",
    startDate: o.startDate ?? null,
    endDate: o.endDate ?? null,
  }))
}

/** memberId でキャンセル・期限切れ含む全サブスクリプション履歴を取得 */
export async function getAllSubscriptions(memberId: string): Promise<WixSubscription[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (getWixClient().orders as any).managementListOrders({
    buyerIds: [memberId],
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (result.orders || []).map((o: any) => ({
    planName: o.planName ?? "?",
    status: o.status ?? "UNKNOWN",
    startDate: o.startDate ?? null,
    endDate: o.endDate ?? null,
  }))
}

/** 管理用: 全サブスクリプションのサマリーを取得 */
export async function getSubscriptionStats() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (getWixClient().orders as any).managementListOrders()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allOrders = (result.orders || []) as any[]

  const byPlanAndStatus: Record<string, Record<string, number>> = {}
  for (const o of allOrders) {
    const plan = o.planName ?? "?"
    const status = o.status ?? "UNKNOWN"
    if (!byPlanAndStatus[plan]) byPlanAndStatus[plan] = {}
    byPlanAndStatus[plan][status] = (byPlanAndStatus[plan][status] || 0) + 1
  }

  return { total: allOrders.length, byPlanAndStatus }
}

// ─── Loyalty transaction types ───
export type LoyaltyTx = {
  id: string
  amount: number
  type: string // EARN, REDEEM, ADJUST, REFUND, EXPIRE
  description: string
  createdDate: string | null
}

/** accountId からポイント取引履歴を取得（最新20件） */
export async function getLoyaltyTransactions(accountId: string): Promise<LoyaltyTx[]> {
  try {
    const result = await getWixClient().transactions.queryLoyaltyTransactions()
      .eq("accountId", accountId)
      .descending("_createdDate")
      .limit(20)
      .find()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (result.items || []).map((t: any) => ({
      id: t._id ?? "",
      amount: t.amount ?? 0,
      type: t.transactionType ?? "UNKNOWN",
      description: t.description ?? "",
      createdDate: t._createdDate ? new Date(t._createdDate).toISOString() : null,
    }))
  } catch (e) {
    console.error("[wix] getLoyaltyTransactions error:", e)
    return []
  }
}

/** 全Wixサイト会員のメールアドレスを取得（offset pagination） */
export async function getAllMemberEmails(): Promise<string[]> {
  const emails: string[] = []
  let offset = 0
  const limit = 100

  while (true) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await getWixClient().members.queryMembers()
      .limit(limit)
      .skip(offset)
      .find()

    const items = result.items || []

    // Debug: log structure on first batch
    if (offset === 0) {
      console.log("[wix] getAllMemberEmails: totalCount =", result.totalCount, "first batch =", items.length)
      if (items.length > 0) {
        console.log("[wix] Sample member keys:", Object.keys(items[0]))
      }
    }

    for (const member of items) {
      // Try multiple possible email fields
      const email = member.loginEmail
        || member.profile?.email
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        || (member as any).contactDetails?.emails?.[0]
      if (email) emails.push(email)
    }

    if (items.length < limit) break
    offset += limit
    if (offset >= 10000) break // safety limit
  }

  // Fallback: try Contacts API if Members returned nothing
  if (emails.length === 0) {
    console.log("[wix] Members returned 0 emails, falling back to Contacts API")
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await getWixClient().contacts.queryContacts({
        paging: { limit: 1000 },
      })
      const contacts = result.contacts ?? []
      console.log("[wix] Contacts fallback: got", contacts.length, "contacts")
      for (const c of contacts) {
        const email = c.primaryInfo?.email
          || c.info?.emails?.[0]?.email
        if (email) emails.push(email)
      }
    } catch (err) {
      console.error("[wix] Contacts fallback failed:", err)
    }
  }

  console.log("[wix] getAllMemberEmails: final count =", emails.length)
  return [...new Set(emails)]
}

/** 全Loyalty取引を取得してサマリーを生成 */
export async function getLoyaltySummary(): Promise<{
  totalAccounts: number
  totalEarned: number
  totalRedeemed: number
  accountDetails: { contactId: string; earned: number; redeemed: number; balance: number }[]
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTx: any[] = []
  let offset = 0

  // Paginate through all transactions
  while (true) {
    try {
      const result = await getWixClient().transactions.queryLoyaltyTransactions()
        .descending("_createdDate")
        .limit(100)
        .skip(offset)
        .find()

      const items = result.items || []
      allTx.push(...items)
      if (items.length < 100) break
      offset += 100
      if (offset >= 5000) break // safety limit
    } catch (err) {
      console.error("[wix] getLoyaltySummary pagination error at offset", offset, err)
      break
    }
  }

  console.log("[wix] getLoyaltySummary: total transactions =", allTx.length)

  // Aggregate by account
  const byAccount: Record<string, { earned: number; redeemed: number }> = {}
  for (const tx of allTx) {
    const acctId = tx.accountId || "unknown"
    if (!byAccount[acctId]) byAccount[acctId] = { earned: 0, redeemed: 0 }
    const amount = tx.amount ?? 0
    const type = tx.transactionType ?? ""
    if (type === "EARN" || type === "ADJUST") {
      byAccount[acctId].earned += amount
    } else if (type === "REDEEM" || type === "EXPIRE") {
      byAccount[acctId].redeemed += Math.abs(amount)
    }
  }

  let totalEarned = 0
  let totalRedeemed = 0
  const accountDetails = Object.entries(byAccount).map(([contactId, v]) => {
    totalEarned += v.earned
    totalRedeemed += v.redeemed
    return { contactId, earned: v.earned, redeemed: v.redeemed, balance: v.earned - v.redeemed }
  })

  return {
    totalAccounts: accountDetails.length,
    totalEarned,
    totalRedeemed,
    accountDetails: accountDetails.sort((a, b) => b.balance - a.balance),
  }
}

/** contactId から Loyalty アカウント（ポイント情報）を取得 */
export async function getLoyaltyByContactId(contactId: string) {
  const result = await getWixClient().accounts.getAccountBySecondaryId({
    contactId,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (result as any).account ?? result ?? null
}

/**
 * メールアドレスでポイントを付与する（Wix SDK 直接呼び出し）
 * 1. Contact を検索（なければ作成）
 * 2. Loyalty アカウントを取得（なければ作成）
 * 3. earnPoints でポイント付与
 * @returns { success, contactId, accountId, error? }
 */
export async function awardPointsByEmail(
  email: string,
  points: number,
  idempotencyKey: string,
  description: string,
): Promise<{ success: boolean; contactId?: string; accountId?: string; error?: string }> {
  const client = getWixClient()

  // 1. Find or create contact
  let contact = await getContactByEmail(email)
  if (!contact) {
    try {
      // SDK createContact is broken with @wix/contacts import — use REST API
      const res = await fetch("https://www.wixapis.com/contacts/v4/contacts", {
        method: "POST",
        headers: {
          Authorization: process.env.WIX_API_KEY!,
          "wix-site-id": process.env.WIX_SITE_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          info: { emails: { items: [{ email }] } },
        }),
      })
      const data = await res.json()
      contact = data?.contact ?? null
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: false, error: `createContact failed: ${(e as any).message}` }
    }
  }

  const contactId = contact?._id ?? contact?.id ?? contact?.contactId
  if (!contactId) {
    return { success: false, error: "Could not resolve contactId" }
  }

  // 2. Find or create loyalty account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let account: any = null
  try {
    const result = await client.accounts.getAccountBySecondaryId({ contactId })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account = (result as any).account ?? result
  } catch {
    // getAccountBySecondaryId threw — account doesn't exist
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let accountId = (account as any)?._id ?? (account as any)?.id ?? (account as any)?.accountId

  if (!accountId) {
    // Account doesn't exist or was empty — create via REST API (SDK has bug with createAccount)
    try {
      const res = await fetch("https://www.wixapis.com/loyalty-accounts/v1/accounts", {
        method: "POST",
        headers: {
          Authorization: process.env.WIX_API_KEY!,
          "wix-site-id": process.env.WIX_SITE_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contactId }),
      })
      const data = await res.json()
      account = data?.account ?? null
      accountId = account?.id ?? account?._id
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: false, contactId, error: `createAccount failed: ${(e as any).message}` }
    }
  }
  if (!accountId) {
    return { success: false, contactId, error: "Could not resolve accountId" }
  }

  // 3. Earn points
  try {
    await client.accounts.earnPoints(accountId, {
      amount: points,
      appId: "p-aicujp-survey",
      idempotencyKey,
      description,
    })
    return { success: true, contactId, accountId }
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { success: false, contactId, accountId, error: `earnPoints failed: ${(e as any).message}` }
  }
}
