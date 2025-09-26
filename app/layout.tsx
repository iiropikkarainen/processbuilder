import "./globals.css"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import SupabaseProvider from "../components/supabase-provider"

export const metadata: Metadata = {
  title: "workflow-builder",
  description: "App",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // ✅ cookies() must be awaited
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const session = user ? { user } : null

  return (
    <html lang="en">
      <body>
        <SupabaseProvider initialSession={session}>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}