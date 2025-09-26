"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSupabaseClient } from "@supabase/auth-helpers-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useSupabaseClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // ✅ Securely fetch the authenticated user
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error

        if (!data.user) {
          console.error("❌ No authenticated user after callback")
          router.replace("/login")
          return
        }

        console.log("✅ Authenticated user:", data.user)

        // ✅ Sanitize redirect target
        let redirect = searchParams.get("redirect") || "/overview"
        const allowedRedirects = ["/overview", "/dashboard", "/"]
        if (!allowedRedirects.includes(redirect)) {
          console.warn("⚠️ Invalid redirect, falling back to /overview:", redirect)
          redirect = "/overview"
        }

        router.replace(redirect)
        router.refresh()
      } catch (err) {
        console.error("❌ Auth callback error:", err)
        router.replace("/login")
      }
    }

    handleCallback()
  }, [supabase, router, searchParams])

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Signing you in…</p>
    </div>
  )
}