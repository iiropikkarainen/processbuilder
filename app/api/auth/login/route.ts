import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/auth"

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 },
    )
  }

  const { email, password } = body as {
    email?: unknown
    password?: unknown
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    )
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "authenticated",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  })

  return response
}
