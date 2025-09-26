// /app/api/auth/logout/route.ts
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function POST() {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  // ✅ clear Supabase session on server & client
  await supabase.auth.signOut()

  const response = NextResponse.json({ success: true })

  // If you still have a custom AUTH cookie, clear it too
  response.cookies.set({
    name: "AUTH",
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  })

  return response
}