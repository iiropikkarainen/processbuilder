"use client"

import { useState } from "react"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { createPagesBrowserClient, type Session } from "@supabase/auth-helpers-nextjs"

export default function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession?: Session | null
}) {
  const [supabase] = useState(() => createPagesBrowserClient())

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  )
}