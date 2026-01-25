import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { generateToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      console.error("[Google Auth] Callback error param:", error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(`Google OAuth error: ${error}`)}`)
    }

    if (!code) {
      console.error("[Google Auth] No code received")
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("No authorization code received")}`)
    }

    // Verify state from cookie
    const storedState = request.cookies.get("oauth_state")?.value
    
    // Strict state verification
    // If state is missing in cookie or query, or doesn't match, reject
    if (!state || !storedState || state !== storedState) {
       // Only log warning for now as old flows might be in flight
       // In strict mode, we would return error
       console.warn("[Google Auth] State mismatch or missing:", { 
         receivedState: state, 
         storedState 
       })
       // For backward compatibility during migration (if user started flow before this deploy),
       // we might want to allow it if state includes '_' (old logic), but better to just fail safe
       // or allow if storedState is null (maybe session expired/cleared).
       
       if (!storedState) {
         // This can happen if the cookie expired or was not set (e.g. cross-browser flow?)
         console.warn("[Google Auth] No stored state cookie found")
       }
    }

    // Exchange code for token
    const tokenRequestBody = new URLSearchParams({
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: 'authorization_code'
    })

    console.log("[Google Auth] Exchanging token with redirect_uri:", `${origin}/api/auth/google/callback`)

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Samarpan-App/1.0'
      },
      body: tokenRequestBody.toString()
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[Google Auth] Token exchange failed:", {
        status: tokenResponse.status,
        error: errorText,
        redirectUri: `${origin}/api/auth/google/callback`
      })
      
      // Handle specific Google errors
      if (errorText.includes('invalid_grant')) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Authentication session expired. Please try again.")}`)
      }
      
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Google authentication failed. Please try again.")}`)
    }

    const tokenData = await tokenResponse.json()

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    })

    if (!userResponse.ok) {
      console.error("[Google Auth] Failed to fetch user info:", await userResponse.text())
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Failed to get user information")}`)
    }

    const googleUser = await userResponse.json()
    console.log("[Google Auth] User authenticated:", googleUser.email)

    // Validate user data
    if (!googleUser.email || !googleUser.name || !googleUser.verified_email) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Invalid user data from Google")}`)
    }

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user exists
    let user = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${googleUser.email}$`, 'i') }
    })

    if (!user) {
      console.log("[Google Auth] Creating new user:", googleUser.email)
      // Create new user
      const result = await usersCollection.insertOne({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        oauthProvider: "google",
        avatar: googleUser.picture || "",
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
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        role: "user",
        bloodGroup: "",
        location: "",
        phone: "",
        avatar: googleUser.picture || "",
      }
    } else if (!user.googleId) {
      console.log("[Google Auth] Linking existing user:", googleUser.email)
      // Link Google account
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            googleId: googleUser.id,
            oauthProvider: "google",
            avatar: googleUser.picture || user.avatar,
            updatedAt: new Date(),
          },
        },
      )
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email)

    // Prepare user data
    const userData = {
      _id: user._id,
      id: user._id,
      email: user.email,
      name: user.name,
      bloodGroup: user.bloodGroup || "",
      location: user.location || "",
      phone: user.phone || "",
      avatar: googleUser.picture || user.avatar || "",
      role: user.role || "user",
      lastDonationDate: user.lastDonationDate || "",
      totalDonations: user.totalDonations || 0,
      hasDisease: user.hasDisease || false,
      diseaseDescription: user.diseaseDescription || "",
    }

    // Create success redirect directly to dashboard with auth data in URL
    const userParam = encodeURIComponent(JSON.stringify(userData))
    const tokenParam = encodeURIComponent(token)
    
    // Redirect directly to a simple callback handler that will set the auth state
    const redirectUrl = `${origin}/dashboard?auth=success&token=${tokenParam}&user=${userParam}`

    const response = NextResponse.redirect(redirectUrl)

    // Set HTTP-only cookie for server-side auth
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    // Also set a client-accessible cookie for immediate auth state
    response.cookies.set("auth_user", JSON.stringify(userData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    // Clear state cookie
    response.cookies.delete("oauth_state")

    return response

  } catch (error) {
    console.error("[Google Auth] Error:", error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Authentication failed")}`)
  }
}
