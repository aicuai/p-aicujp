import Link from 'next/link'

export default function Dashboard() {
  // TODO: Get user data from session
  const user = {
    name: 'ユーザー名',
    email: 'user@example.com',
    discordId: '123456789',
    points: 1250,
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            AICU <span className="text-aicu-primary">Portal</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button className="text-sm text-gray-500 hover:text-gray-700">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Points Card */}
        <div className="bg-gradient-to-r from-aicu-primary to-aicu-secondary rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">AICUポイント</p>
              <p className="text-4xl font-bold mt-1">
                {user.points.toLocaleString()}
                <span className="text-lg ml-1">pt</span>
              </p>
            </div>
            <div className="text-6xl opacity-20">🎯</div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              href="/dashboard/points"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              ポイント履歴
            </Link>
            <Link
              href="/dashboard/purchases"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              購入履歴
            </Link>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Profile */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-aicu-primary/10 rounded-full flex items-center justify-center">
                👤
              </div>
              <h2 className="text-lg font-semibold">プロフィール</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">メールアドレス</span>
                <span className="text-gray-800">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discord</span>
                <span className="text-gray-800">連携済み ✅</span>
              </div>
            </div>
          </div>

          {/* Membership */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-aicu-accent/10 rounded-full flex items-center justify-center">
                ⭐
              </div>
              <h2 className="text-lg font-semibold">会員プラン</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">現在のプラン</span>
                <span className="text-aicu-primary font-medium">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lab+へアップグレード</span>
                <span className="text-gray-800">¥3,500/月</span>
              </div>
            </div>
            <button className="mt-4 w-full py-2 bg-aicu-primary hover:bg-aicu-secondary text-white rounded-lg text-sm transition-colors">
              プランを変更
            </button>
          </div>
        </div>

        {/* Discord Community */}
        <div className="bg-[#5865F2] rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">AICUコミュニティ</h2>
              <p className="text-sm opacity-80 mt-1">
                Discordでメンバーと交流しよう
              </p>
            </div>
            <a
              href="https://discord.gg/your-invite-link"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-[#5865F2] rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              参加する
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
