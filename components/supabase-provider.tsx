"use client"

import { useState } from "react"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { createPagesBrowserClient, type Session } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export default function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession?: Session | null
}) {
  const [supabase] = useState(() => createPagesBrowserClient<Database>())

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  )
}