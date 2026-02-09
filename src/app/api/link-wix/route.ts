import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getContactByEmail, getMemberByContactId } from "@/lib/wix"
import { linkWixContact } from "@/lib/supabase"

const SUPERUSER_EMAIL = "shirai@mail.com"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.discord_id || session.user.email !== SUPERUSER_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { wixEmail } = await req.json()
  if (!wixEmail || typeof wixEmail !== "string") {
    return NextResponse.json({ error: "wixEmail is required" }, { status: 400 })
  }

  // Wix Contact 検索
  const contact = await getContactByEmail(wixEmail)
  if (!contact?._id) {
    return NextResponse.json({ error: `Wix Contact not found for ${wixEmail}` }, { status: 404 })
  }

  // Member 検索（任意）
  let memberId: string | null = null
  try {
    const member = await getMemberByContactId(contact._id)
    memberId = member?._id ?? null
  } catch {
    // Member がいなくても OK
  }

  // unified_users にリンク
  const user = await linkWixContact(session.user.discord_id, contact._id, memberId)

  return NextResponse.json({
    success: true,
    wix_contact_id: contact._id,
    wix_member_id: memberId,
    user,
  })
}
