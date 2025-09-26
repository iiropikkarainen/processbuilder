"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSupabaseClient } from "@supabase/auth-helpers-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useSupabaseClient()

  useEffect(() => {
    async function handleCallback() {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)

      if (error) {
        console.error("❌ Auth callback error:", error)
        router.replace("/login")
        return
      }

      console.log("✅ Session established:", data.session)

      const redirect = searchParams.get("redirect") ?? "/"
      router.replace(redirect)
      router.refresh()
    }

    handleCallback()
  }, [router, searchParams, supabase])

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Signing you in…</h1>
        <p className="text-muted-foreground mt-4 text-sm">
          Please wait while we finish connecting your Google account.
        </p>
      </div>
    </div>
  )
}
