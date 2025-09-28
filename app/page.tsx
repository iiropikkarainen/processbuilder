"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@supabase/auth-helpers-react"

export default function Home() {
  const router = useRouter()
  const user = useUser()

  useEffect(() => {
    if (user === null) {
      router.replace("/login")
    } else if (user) {
      router.replace("/operations")
    }
  }, [user, router])

  return <p>Redirecting…</p>
}