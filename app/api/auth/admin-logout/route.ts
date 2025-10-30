import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { message: "Admin logout successful" },
    { status: 200 },
  )

  // Clear admin token cookie
  response.cookies.set({
    name: "adminToken",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
  })

  return response
}