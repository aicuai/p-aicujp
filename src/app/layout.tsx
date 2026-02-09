import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AICU Portal - Point, Profile, Post',
  description: 'AICUポイント管理・Discord連携ポータル',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
