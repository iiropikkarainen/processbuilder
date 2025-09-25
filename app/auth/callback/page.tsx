"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type SupabaseUser = {
  id: string
  email?: string | null
}

function parseHashParams(hash: string) {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash)
  const result: Record<string, string> = {}

  for (const [key, value] of params.entries()) {
    result[key] = value
  }

  return result
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  const redirectTo = useMemo(() => {
    const target = searchParams.get("redirect")

    if (!target || !target.startsWith("/")) {
      return "/"
    }

    return target
  }, [searchParams])

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Supabase environment variables are not configured.")
      return
    }

    const hashParams = parseHashParams(window.location.hash)
    const queryState = searchParams.get("state")
    const providerState = hashParams.state ?? queryState ?? ""
    let storedState = ""

    try {
      storedState = sessionStorage.getItem("supabase.oauth.state") ?? ""
    } catch {
      storedState = ""
    }

    if (storedState && providerState && storedState !== providerState) {
      setError("State mismatch detected. Please try logging in again.")
      try {
        sessionStorage.removeItem("supabase.oauth.state")
      } catch {
        // ignore storage access issues
      }
      return
    }

    try {
      sessionStorage.removeItem("supabase.oauth.state")
    } catch {
      // ignore storage access issues
    }

    if (hashParams.error) {
      setError(hashParams.error_description ?? "Unable to sign in with Google.")
      return
    }

    const accessToken = hashParams.access_token
    const refreshToken = hashParams.refresh_token

    if (!accessToken) {
      setError("Missing access token. Please try logging in again.")
      return
    }

    let isMounted = true

    async function establishSession() {
      try {
        const userResponse = await fetch(
          `${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: supabaseAnonKey,
            },
          },
        )

        if (!userResponse.ok) {
          throw new Error("Failed to fetch Supabase user profile")
        }

        const user: SupabaseUser = await userResponse.json()
        const email = user.email ?? `${user.id}@google-oauth`

        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password: "google-oauth" }),
        })

        if (!loginResponse.ok) {
          throw new Error("Failed to establish application session")
        }

        try {
          localStorage.setItem("supabase.access_token", accessToken)

          if (refreshToken) {
            localStorage.setItem("supabase.refresh_token", refreshToken)
          }
        } catch {
          // Access to localStorage might be restricted. Ignore errors.
        }

        router.replace(redirectTo)
        router.refresh()
      } catch (cause) {
        console.error("Supabase Google login failed", cause)

        if (!isMounted) {
          return
        }

        setError("Unable to complete Google sign-in. Please try again.")
      }
    }

    establishSession()

    return () => {
      isMounted = false
    }
  }, [redirectTo, router, searchParams])

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Signing you in…</h1>
        <p className="text-muted-foreground mt-4 text-sm">
          {error
            ? error
            : "Please wait while we finish connecting your Google account."}
        </p>
        {error ? (
          <button
            type="button"
            className="mt-6 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
            onClick={() => router.replace("/login")}
          >
            Back to login
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}> 
      <AuthCallbackContent />
    </Suspense>
  )
}

function AuthCallbackFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Signing you in…</h1>
        <p className="text-muted-foreground mt-4 text-sm">
          Preparing your Google session.
        </p>
      </div>
    </div>
  )
}
