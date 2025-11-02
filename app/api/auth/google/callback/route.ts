import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { generateToken } from "@/lib/auth"
import { sendEmail, generateWelcomeEmailHTML } from "@/lib/email"

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  id_token?: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
  given_name?: string
  family_name?: string
  locale?: string
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch Google user info")
  }

  return response.json()
}

async function handleGoogleCallback(
  code: string,
  state: string | null,
  redirectUri?: string,
): Promise<{ token: string; user: any; error?: string }> {
  try {
    console.log("[Google Auth] Processing authorization code...")

    if (!code) {
      throw new Error("Authorization code is required")
    }

    // Verify CSRF state if provided
    if (state) {
      console.log("[Google Auth] Verifying CSRF state...")
      // Note: In production, validate state from server-side session store
    }

    console.log("[Google Auth] Exchanging authorization code for tokens...")

    // Use provided redirectUri or fallback to localhost
    const finalRedirectUri = redirectUri || "http://localhost:3000/api/auth/google/callback"
    console.log("[Google Auth] Redirect URI:", finalRedirectUri)

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: finalRedirectUri,
        grant_type: "authorization_code",
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error("[Google Auth] Token exchange failed:")
      console.error("  Status:", tokenResponse.status)
      console.error("  Response:", error)
      console.error("  Used redirect_uri:", finalRedirectUri)
      console.error("  Client ID:", process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING")
      console.error("  Client Secret:", process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING")
      throw new Error("Failed to exchange authorization code")
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()
    console.log("[Google Auth] Successfully exchanged code for tokens")

    // Get user info from Google
    console.log("[Google Auth] Fetching user information...")
    const userInfo = await getGoogleUserInfo(tokens.access_token)
    console.log("[Google Auth] User info retrieved:", { email: userInfo.email, name: userInfo.name })

    const { email, name, picture, sub: googleId } = userInfo

    // Validate required fields
    if (!email || !name) {
      throw new Error("Missing required user information from Google")
    }

    // Connect to MongoDB
    console.log("[Google Auth] Connecting to database...")
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user exists
    console.log("[Google Auth] Checking if user exists...")
    let user = await usersCollection.findOne({ email })

    if (!user) {
      // Create new user
      console.log("[Google Auth] Creating new user...")
      const result = await usersCollection.insertOne({
        email,
        name,
        googleId,
        oauthProvider: "google",
        avatar: picture,
        bloodGroup: "",
        location: "",
        phone: "",
        role: "user",
        lastDonationDate: null,
        totalDonations: 0,
        hasDisease: false,
        diseaseDescription: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      user = {
        _id: result.insertedId,
        email,
        name,
        googleId,
        role: "user",
        bloodGroup: "",
        location: "",
        phone: "",
      }
      console.log("[Google Auth] New user created:", result.insertedId)

      // Send welcome email to new OAuth user
      console.log("[Google Auth] Sending welcome email to:", email)
      const welcomeEmailHTML = generateWelcomeEmailHTML({
        userName: name,
        email: email,
        authType: "oauth",
      })

      const emailSent = await sendEmail({
        to: email,
        subject: "Welcome to Samarpan - Your Blood Donation Journey Starts Here!",
        html: welcomeEmailHTML,
        replyTo: process.env.SMTP_FROM || "noreply@samarpan.com",
      })

      if (emailSent) {
        console.log("[Google Auth] ✅ Welcome email sent successfully to:", email)
      } else {
        console.warn("[Google Auth] ⚠️  Failed to send welcome email to:", email)
        // Don't fail the auth if email sending fails - user account is created
      }
    } else if (!user.googleId) {
      // Link Google account to existing user
      console.log("[Google Auth] Linking Google account to existing user...")
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            googleId,
            oauthProvider: "google",
            avatar: picture || user.avatar,
            updatedAt: new Date(),
          },
        },
      )
      user.googleId = googleId
      console.log("[Google Auth] Google account linked successfully")
    } else {
      console.log("[Google Auth] User already authenticated with Google")
    }

    // Generate JWT
    console.log("[Google Auth] Generating JWT token...")
    const token = generateToken(user._id.toString())

    console.log("[Google Auth] Authentication successful for user:", user.email)
    return {
      token,
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        name: user.name,
        bloodGroup: user.bloodGroup || "",
        location: user.location || "",
        phone: user.phone || "",
        avatar: picture,
        role: user.role || "user",
        lastDonationDate: user.lastDonationDate || "",
        totalDonations: user.totalDonations || 0,
        hasDisease: user.hasDisease || false,
        diseaseDescription: user.diseaseDescription || "",
      },
    }
  } catch (error) {
    console.error("[Google Auth] Authentication error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    throw new Error(errorMessage)
  }
}

// Handle GET request from Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    console.log("[Google Auth] GET callback received")

    // Get the origin from the request headers for dynamic domain support
    const origin = request.headers.get("x-forwarded-proto")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
      : request.nextUrl.origin

    if (error) {
      console.error("[Google Auth] OAuth error:", error)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error)}&google_error=true`,
      )
    }

    if (!code) {
      console.log("[Google Auth] No authorization code in callback")
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("No authorization code received")}&google_error=true`,
      )
    }

    const redirectUri = `${origin}/api/auth/google/callback`
    const result = await handleGoogleCallback(code, state, redirectUri)

    if (result.error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(result.error)}&google_error=true`,
      )
    }

    // Redirect to handler page with token and user data as query params
    // The handler page will store in localStorage and then redirect to dashboard
    const userData = encodeURIComponent(JSON.stringify(result.user))
    const redirectUrl = `${origin}/auth/google-callback-handler?token=${encodeURIComponent(result.token)}&user=${userData}`

    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl)

    // Also set token cookie for API requests
    response.cookies.set("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[Google Auth] Callback error:", error)
    const errorMessage = error instanceof Error ? error.message : "Authentication failed"
    
    // Get the origin from the request headers
    const origin = request.headers.get("x-forwarded-proto")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
      : request.nextUrl.origin
    
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMessage)}&google_error=true`,
    )
  }
}

// Handle POST request (for token exchange)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 })
    }

    // Get the origin from the request headers for dynamic domain support
    const origin = request.headers.get("x-forwarded-proto")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
      : request.nextUrl.origin
    
    const redirectUri = `${origin}/api/auth/google/callback`
    const result = await handleGoogleCallback(code, null, redirectUri)

    const response = NextResponse.json(
      {
        message: "Login successful",
        token: result.token,
        user: result.user,
      },
      { status: 200 },
    )

    // Set token in HTTP-only cookie
    response.cookies.set("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[Google Auth] POST callback error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: `Authentication failed: ${errorMessage}` }, { status: 500 })
  }
}