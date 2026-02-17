import { Metadata } from "next"
import UnsubscribeClient from "./UnsubscribeClient"

export const metadata: Metadata = {
  title: "配信設定 | AICU Japan",
  robots: "noindex",
}

export default async function MailNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>
}) {
  const params = await searchParams
  const email = params.email || ""
  const token = params.token || ""

  return <UnsubscribeClient email={email} token={token} />
}
