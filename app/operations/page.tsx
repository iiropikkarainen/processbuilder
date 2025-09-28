"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@supabase/auth-helpers-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { OperationsCatalog } from "@/components/operations"

export default function OperationsPage() {
  const [query, setQuery] = useState("")
  const router = useRouter()
  const user = useUser()

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
      <OperationsCatalog query={query} />
    </DashboardShell>
  )
}

