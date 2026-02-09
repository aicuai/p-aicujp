import NextAuth from "next-auth"
import { getOrCreateUser, linkWixContact } from "@/lib/supabase"
import { getContactByEmail, getMemberByContactId } from "@/lib/wix"
import authConfig from "./auth.config"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      discord_id?: string
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account }) {
      if (account?.provider !== "discord") return true

      const discordId = account.providerAccountId
      const email = user.email ?? null
      const name = user.name ?? null

      try {
        // Supabase に unified_users を UPSERT
        await getOrCreateUser(discordId, email, name)

        // Discord メールで Wix Contact を検索し、自動リンク
        if (email) {
          const contact = await getContactByEmail(email)
          if (contact?._id) {
            const member = await getMemberByContactId(contact._id)
            await linkWixContact(discordId, contact._id, member?._id ?? null)
          }
        }
      } catch (e) {
        // Wix/Supabase 連携失敗でもログイン自体はブロックしない
        console.error("[auth] signIn link error:", e)
      }

      return true
    },

    async jwt({ token, account }) {
      if (account?.provider === "discord") {
        token.discord_id = account.providerAccountId
      }
      return token
    },

    async session({ session, token }) {
      if (token.discord_id) {
        session.user.discord_id = token.discord_id as string
      }
      return session
    },
  },
})
