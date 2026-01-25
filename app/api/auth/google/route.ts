import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin
    
    // Generate a secure state
    const state = `${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '')
    googleAuthUrl.searchParams.set('redirect_uri', `${origin}/api/auth/google/callback`)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('state', state)
    googleAuthUrl.searchParams.set('access_type', 'offline')
    googleAuthUrl.searchParams.set('prompt', 'consent')
    googleAuthUrl.searchParams.set('include_granted_scopes', 'true')

    const response = NextResponse.redirect(googleAuthUrl.toString())
    
    // Set state in a secure cookie for verification in callback
    // This allows the server to verify the state, unlike sessionStorage
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[Google Auth] Init error:", error)
    return NextResponse.json({ error: "Failed to initialize Google login" }, { status: 500 })
  }
}
