"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      style={{ fontSize: 13, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
    >
      ログアウト
    </button>
  )
}
