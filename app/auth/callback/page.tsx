"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs"

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

  const authCode = useMemo(() => searchParams.get("code"), [searchParams])
  const authError = useMemo(
    () => searchParams.get("error_description") ?? searchParams.get("error"),
    [searchParams],
  )

  useEffect(() => {
    const supabase = createPagesBrowserClient()

    let isMounted = true

    async function establishSession() {
      try {
        if (authError) {
          throw new Error(authError)
        }

        if (!authCode) {
          throw new Error("Missing authorization code. Please try logging in again.")
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession({
          authCode,
        })

        if (exchangeError) {
          throw exchangeError
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          throw new Error("Missing access token. Please try logging in again.")
        }

        if (!isMounted) {
          return
        }

        router.replace(redirectTo)
        router.refresh()
      } catch (cause) {
        console.error("Supabase Google login failed", cause)

        if (!isMounted) {
          return
        }

        const message =
          cause instanceof Error && cause.message
            ? cause.message
            : "Missing access token. Please try logging in again."

        setError(message)
      }
    }

    establishSession()

    return () => {
      isMounted = false
    }
  }, [authCode, authError, redirectTo, router])

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
