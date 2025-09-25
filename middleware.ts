import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/auth"

const PUBLIC_ROUTES = new Set(["/login"])

function getRedirectPath(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (!search) {
    return pathname
  }

  return `${pathname}${search}`
}

function resolveRedirectUrl(request: NextRequest, destination: string | null) {
  const target = destination && destination.startsWith("/") ? destination : "/"
  return new URL(target, request.url)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/callback")
  ) {
    return NextResponse.next()
  }

  if (pathname === "/favicon.ico" || /\.[^/]+$/.test(pathname)) {
    return NextResponse.next()
  }

  const isPublicRoute = PUBLIC_ROUTES.has(pathname)
  const isAuthenticated = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value)

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url)
    const redirectPath = getRedirectPath(request)

    if (redirectPath && redirectPath !== "/login") {
      loginUrl.searchParams.set("redirect", redirectPath)
    }

    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && isPublicRoute) {
    const redirectTo = request.nextUrl.searchParams.get("redirect")
    return NextResponse.redirect(resolveRedirectUrl(request, redirectTo))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/(.*)"],
}
