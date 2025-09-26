"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClientComponentClient()

    async function handleAuth() {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ Supabase session fetch error:", error)
        router.replace("/login")
        return
      }

      if (session?.user) {
        console.log("✅ Logged in user:", session.user)
        const redirect = searchParams.get("redirect") ?? "/"
        router.replace(redirect)
        router.refresh()
      } else {
        console.warn("⚠️ No active session found after callback")
        router.replace("/login")
      }
    }

    handleAuth()
  }, [router, searchParams])

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
