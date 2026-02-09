import Discord from "next-auth/providers/discord"
import type { NextAuthConfig } from "next-auth"

// Edge Runtime 互換の設定（middleware 用）
// Wix/Supabase SDK は Node.js Runtime でのみ使用
export default {
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
  ],
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth
    },
  },
} satisfies NextAuthConfig
