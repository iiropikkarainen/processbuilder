import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

const PUBLIC_ROUTES = new Set(["/login"])

function getRedirectPath(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  return search ? `${pathname}${search}` : pathname
}

function resolveRedirectUrl(request: NextRequest, destination: string | null) {
  const target = destination && destination.startsWith("/") ? destination : "/"
  return new URL(target, request.url)
}

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // ✅ secure check: call Supabase to verify user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // allow static assets and callback
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/callback") ||
    pathname === "/favicon.ico" ||
    /\.[^/]+$/.test(pathname)
  ) {
    return res
  }

  const isPublicRoute = PUBLIC_ROUTES.has(pathname)

  if (!user && !isPublicRoute) {
    // not logged in → redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isPublicRoute) {
    // already logged in → skip login page
    const redirectTo = request.nextUrl.searchParams.get("redirect")
    return NextResponse.redirect(resolveRedirectUrl(request, redirectTo))
  }

  return res
}

export const config = {
  matcher: ["/(.*)"],
}