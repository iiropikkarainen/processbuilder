"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, useSessionContext } from "@supabase/auth-helpers-react"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoading } = useSessionContext()
  const session = useSession()
  const [hasRedirected, setHasRedirected] = useState(false)

  const loggedOut = searchParams.get("loggedOut") === "true" ? true : false

  useEffect(() => {
    if (!isLoading && session && !hasRedirected && !loggedOut) {
      let redirect = searchParams.get("redirect") || "/overview"

      // ✅ only allow known routes
      const allowedRedirects = ["/overview", "/dashboard", "/"]
      if (!allowedRedirects.includes(redirect)) {
        console.warn("⚠️ Invalid redirect detected, falling back to /overview:", redirect)
        redirect = "/overview"
      }

      setHasRedirected(true)
      console.log("✅ Redirecting to:", redirect, "with session:", session)
      router.replace(redirect)
    }
    if (loggedOut) {
      setHasRedirected(false)
    }
  }, [isLoading, session, hasRedirected, router, searchParams, loggedOut])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking session…</p>
      </div>
    )
  }

  if (session && !loggedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Redirecting…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}