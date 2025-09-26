"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"

import OpsCatalog from "@/components/ops-catalog"
import { DashboardShell } from "@/components/dashboard-shell"

export default function Home() {
  const [query, setQuery] = useState("")
  const router = useRouter()
  const supabase = useSupabaseClient()
  const user = useUser()

  // ✅ redirect if no user
  useEffect(() => {
    if (user === null) {
      router.replace("/login")
    }
  }, [user, router])

  if (!user) {
    return <p>Redirecting to login…</p>
  }

  return (
    <DashboardShell
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search categories or Processes…",
      }}
    >
      <OpsCatalog query={query} />
    </DashboardShell>
  )
}