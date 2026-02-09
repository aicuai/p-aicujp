import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SignOutButton from "./SignOutButton"
import LinkWixForm from "./LinkWixForm"
import { getUserByDiscordId } from "@/lib/supabase"
import { getLoyaltyByContactId, getMemberByContactId } from "@/lib/wix"

const SUPERUSER_EMAIL = "shirai@mail.com"

export default async function Dashboard() {
  const session = await auth()
  if (!session?.user) redirect("/")

  const user = session.user

  const isSuperuser = user.email === SUPERUSER_EMAIL

  // Wix データ取得
  let points: number | null = null
  let wixLinked = false
  let unifiedUserId: string | null = null
  let wixProfile: {
    firstName?: string | null
    lastName?: string | null
    company?: string | null
    profilePhoto?: string | null
    nickname?: string | null
  } | null = null

  try {
    if (user.discord_id) {
      const unifiedUser = await getUserByDiscordId(user.discord_id)

      unifiedUserId = unifiedUser?.id ?? null

      if (unifiedUser?.wix_contact_id) {
        wixLinked = true

        // ポイント取得
        const loyalty = await getLoyaltyByContactId(unifiedUser.wix_contact_id)
        if (loyalty?.points) {
          points = loyalty.points.balance ?? 0
        }

        // プロフィール取得
        const member = await getMemberByContactId(unifiedUser.wix_contact_id)
        if (member) {
          wixProfile = {
            firstName: member.contact?.firstName,
            lastName: member.contact?.lastName,
            company: member.contact?.company,
            profilePhoto: member.profile?.photo?.url,
            nickname: member.profile?.nickname,
          }
        }
      }
    }
  } catch (e) {
    console.error("[dashboard] Wix data fetch error:", e)
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">
            AICU.jp <span className="text-aicu-primary">Portal</span>
          </h1>
          <div className="flex items-center gap-3">
            {user.image && (
              <img
                src={user.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-300 hidden sm:inline">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Points Card */}
        <div className="bg-gradient-to-r from-aicu-primary to-aicu-secondary rounded-2xl p-5 text-white">
          <p className="text-sm opacity-80">AICUポイント</p>
          <p className="text-3xl font-bold mt-1">
            {points !== null ? points.toLocaleString() : "---"}
            <span className="text-base ml-1">pt</span>
          </p>
          {!wixLinked && (
            <p className="text-xs opacity-60 mt-2">Wix 未連携（メールアドレスが一致すると自動連携されます）</p>
          )}
        </div>

        {/* Profile */}
        <div className="rounded-xl p-5 bg-gray-800 border border-gray-700">
          <h2 className="text-base font-semibold text-white mb-3">プロフィール</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">名前</span>
              <span className="text-white">
                {wixProfile?.nickname ?? wixProfile?.firstName ?? user.name}
              </span>
            </div>
            {wixProfile?.company && (
              <div className="flex justify-between">
                <span className="text-gray-400">会社</span>
                <span className="text-white">{wixProfile.company}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">メール</span>
              <span className="text-white">{user.email ?? "未設定"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Discord</span>
              <span className="text-green-400">連携済み</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Wix</span>
              {wixLinked ? (
                <span className="text-green-400">連携済み</span>
              ) : (
                <span className="text-yellow-400">未連携</span>
              )}
            </div>
          </div>
        </div>

        {/* Membership */}
        <div className="rounded-xl p-5 bg-gray-800 border border-gray-700">
          <h2 className="text-base font-semibold text-white mb-3">会員プラン</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">現在のプラン</span>
            <span className="text-aicu-primary font-medium">Free</span>
          </div>
        </div>

        {/* Superuser Panel */}
        {isSuperuser && (
          <div className="rounded-xl p-5 bg-red-900/30 border border-red-700/50 space-y-3">
            <h2 className="text-base font-semibold text-red-300">Super User</h2>
            <div className="space-y-1 text-xs font-mono text-gray-400">
              <p>discord_id: {user.discord_id ?? "—"}</p>
              <p>email: {user.email ?? "—"}</p>
              <p>unified_user_id: {unifiedUserId ?? "—"}</p>
            </div>
            {!wixLinked && (
              <>
                <p className="text-xs text-gray-400">Wix に登録しているメールアドレスを入力して連携</p>
                <LinkWixForm />
              </>
            )}
          </div>
        )}

        {/* Discord Community */}
        <a
          href="https://j.aicu.ai/JoinDiscord"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl p-5 bg-[#5865F2]/20 border border-[#5865F2]/30 hover:bg-[#5865F2]/30 transition-colors"
        >
          <div>
            <h2 className="text-base font-semibold text-white">Discord</h2>
            <p className="text-sm text-gray-400 mt-0.5">コミュニティに参加する</p>
          </div>
          <span className="px-3 py-1.5 bg-[#5865F2] text-white rounded-lg text-sm font-medium">
            参加
          </span>
        </a>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 py-4">
        &copy; 2026 AICU Japan Inc.
      </div>
    </main>
  )
}
