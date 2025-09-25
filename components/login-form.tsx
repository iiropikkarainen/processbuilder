"use client"

import {
  useCallback,
  useMemo,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"

type LoginFormProps = ComponentProps<"form">

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") ?? "/"
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)

  const redirectSearchParam = useMemo(() => {
    if (!redirectTo || redirectTo === "/") {
      return ""
    }

    return `?redirect=${encodeURIComponent(redirectTo)}`
  }, [redirectTo])

  const handleGoogleLogin = useCallback(async () => {
    setIsOAuthLoading(true)
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (error) {
      setError("Failed to initiate Google login.")
      setIsOAuthLoading(false)
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string | null
    const password = formData.get("password") as string | null

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        let message = "Unable to login. Please try again."

        try {
          const payload = await response.json()
          if (typeof payload?.error === "string") {
            message = payload.error
          }
        } catch {
          // ignore JSON parsing issues and fall back to the default message
        }

        setError(message)
        return
      }

      router.push(redirectTo || "/")
      router.refresh()
    } catch (cause) {
      console.error("Login failed", cause)
      setError("Unable to login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in…" : "Login"}
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading || isOAuthLoading}
        >
          <svg
            className="mr-2 size-4"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="#4285F4"
              d="M23.754 12.273c0-.815-.066-1.411-.209-2.031H12.24v3.686h6.564c-.132.917-.843 2.298-2.426 3.224l-.022.15 3.522 2.73.244.022c2.244-2.07 3.512-5.12 3.512-7.781z"
            />
            <path
              fill="#34A853"
              d="M12.24 24c3.294 0 6.066-1.087 8.088-2.951l-3.854-2.984c-1.03.688-2.416 1.17-4.234 1.17-3.237 0-5.984-2.07-6.964-4.944l-.143.012-3.77 2.915-.049.136C3.392 21.216 7.502 24 12.24 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.276 14.291c-.259-.78-.407-1.61-.407-2.476 0-.865.148-1.696.395-2.476l-.007-.166-3.82-2.951-.125.059C.5 8.74 0 10.33 0 11.815c0 1.484.5 3.074 1.312 4.534l3.964-3.058z"
            />
            <path
              fill="#EA4335"
              d="M12.24 4.75c2.297 0 3.845.993 4.73 1.822l3.455-3.37C18.29 1.353 15.534 0 12.24 0 7.502 0 3.392 2.784 1.312 7.281l3.952 3.058c.995-2.874 3.742-5.589 6.976-5.589z"
            />
          </svg>
          {isOAuthLoading ? "Redirecting…" : "Continue with Google"}
        </Button>
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="#" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </form>
  )
}
