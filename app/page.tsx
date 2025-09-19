"use client"

import { useState } from "react"

import OpsCatalog from "@/components/ops-catalog"
import { DashboardShell } from "@/components/dashboard-shell"

export default function Home() {
  const [query, setQuery] = useState("")

  return (
    <DashboardShell
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search categories or SOPs…",
      }}
    >
      <OpsCatalog query={query} />
    </DashboardShell>
  )
}
