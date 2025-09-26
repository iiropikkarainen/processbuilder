"use client"

import { useCallback, useMemo, useState } from "react"
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

function getSafeRedirect(searchParams: ReadonlyURLSearchParams) {
  const target = searchParams.get("redirect")

  if (target && target.startsWith("/")) {
    return target
  }

  return "/overview"
}

export default function LoginForm() {
  const searchParams = useSearchParams()
  const supabase = useSupabaseClient()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectPath = useMemo(() => getSafeRedirect(searchParams), [searchParams])

  const handleGoogleSignIn = useCallback(async () => {
    setError(null)
    setIsSigningIn(true)

    try {
      const origin = window.location.origin
      const redirectQuery =
        redirectPath === "/overview" ? "" : `?redirect=${encodeURIComponent(redirectPath)}`
      const redirectTo = `${origin}/auth/callback${redirectQuery}`

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      })

      if (signInError) {
        throw signInError
      }
    } catch (cause) {
      console.error("Unable to start Google OAuth flow", cause)
      setError("We couldn't connect to Google. Please try again.")
      setIsSigningIn(false)
    }
  }, [redirectPath, supabase])

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in with your Google Workspace account to continue.
        </p>
      </div>
      <Button type="button" onClick={handleGoogleSignIn} disabled={isSigningIn} className="w-full">
        {isSigningIn ? <Loader2 className="size-4 animate-spin" /> : <GoogleLogo className="size-4" />}
        Continue with Google
      </Button>
      {error ? <p className="text-destructive text-sm text-center">{error}</p> : null}
    </div>
  )
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4818h4.84c-.2086 1.125-.8427 2.0786-1.7954 2.7177v2.2581h2.9081c1.7018-1.5668 2.6873-3.874 2.6873-6.6167Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.4686-.8059 5.9581-2.1782l-2.9081-2.2582c-.8059.54-1.8363.8591-3.05.8591-2.3441 0-4.3277-1.5841-5.0363-3.7105H.9571v2.3319C2.4382 15.9832 5.4818 18 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.9636 10.7123C3.7841 10.1723 3.6818 9.5932 3.6818 9c0-.5932.1023-1.1723.2818-1.7123V4.955h-3.0068C.3205 6.1732 0 7.545 0 9s.3205 2.8268.9568 4.045l3.0068-2.3327Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5455c1.3214 0 2.5091.4545 3.4418 1.3459l2.5813-2.5814C13.4636.8914 11.425 0 9 0 5.4818 0 2.4382 2.0168.9568 4.955l3.0068 2.3318C4.6723 5.1295 6.6559 3.5455 9 3.5455Z"
        fill="#EA4335"
      />
    </svg>
  )
}
