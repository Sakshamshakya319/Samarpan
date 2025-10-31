import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword } from "@/lib/auth"
import crypto from "crypto"

interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

// Validate password strength
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required" }
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" }
  }

  if (password.length > 128) {
    return { valid: false, error: "Password is too long (max 128 characters)" }
  }

  // Check for at least one uppercase, one lowercase, and one number
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      valid: false,
      error: "Password must contain uppercase letters, lowercase letters, and numbers",
    }
  }

  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordRequest = await request.json()
    const { token, password, confirmPassword } = body

    console.log("[Password Reset] POST: Processing password reset request")

    if (!token || !password || !confirmPassword) {
      console.warn("[Password Reset] Missing required fields in request")
      return NextResponse.json(
        { error: "Token, password, and confirmPassword are required" },
        { status: 400 },
      )
    }

    // Validate password format
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      console.warn(`[Password Reset] Password validation failed: ${passwordValidation.error}`)
      return NextResponse.json(
        { error: passwordValidation.error || "Invalid password" },
        { status: 400 },
      )
    }

    if (password !== confirmPassword) {
      console.warn("[Password Reset] Password and confirmation do not match")
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    console.log("[Password Reset] All validation checks passed, verifying token...")

    // Hash the token for comparison
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex")
    console.log(`[Password Reset] Token hash: ${resetTokenHash.substring(0, 20)}...`)

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Find user with matching reset token and check expiry
    const user = await usersCollection.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpiry: { $gt: new Date() }, // Token must not be expired
    })

    if (!user) {
      console.warn("[Password Reset] ❌ Invalid or expired token provided")
      return NextResponse.json(
        { error: "Invalid or expired password reset token. Please request a new one." },
        { status: 400 },
      )
    }

    console.log(`[Password Reset] ✅ Token verified for user: ${user.email}`)
    console.log(`[Password Reset] Token expiry: ${user.passwordResetExpiry?.toISOString()}`)

    // Hash new password
    console.log("[Password Reset] Hashing new password...")
    const hashedPassword = await hashPassword(password)

    // Update user password and clear reset token
    console.log(`[Password Reset] Updating password for user: ${user._id}`)
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
          passwordResetCompletedAt: new Date(),
        },
        $unset: {
          passwordResetToken: "",
          passwordResetExpiry: "",
          passwordResetRequestedAt: "",
        },
      },
    )

    console.log(`[Password Reset] Update result:`)
    console.log(`[Password Reset]    - Matched documents: ${updateResult.matchedCount}`)
    console.log(`[Password Reset]    - Modified documents: ${updateResult.modifiedCount}`)

    if (updateResult.modifiedCount === 0) {
      console.error("[Password Reset] ❌ Failed to update user password in database")
      console.error(`[Password Reset] User ID: ${user._id}`)
      return NextResponse.json(
        { error: "Failed to reset password. Please try again." },
        { status: 500 },
      )
    }

    console.log(`[Password Reset] ✅ Password successfully reset`)
    console.log(`[Password Reset]    - Email: ${user.email}`)
    console.log(`[Password Reset]    - User ID: ${user._id}`)
    console.log(`[Password Reset]    - Completed at: ${new Date().toISOString()}`)

    return NextResponse.json(
      { message: "Password reset successful. You can now login with your new password." },
      { status: 200 },
    )
  } catch (error) {
    console.error("[Password Reset] ❌ Unexpected error:", error)
    if (error instanceof Error) {
      console.error(`[Password Reset] Error message: ${error.message}`)
      console.error(`[Password Reset] Error stack: ${error.stack}`)
    }
    // Don't expose internal error details
    return NextResponse.json(
      { error: "Failed to reset password. Please try again later." },
      { status: 500 },
    )
  }
}

// GET endpoint to verify token validity
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    console.log("[Password Reset] GET: Verifying reset token")

    if (!token) {
      console.warn("[Password Reset] No token provided in request")
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    console.log("[Password Reset] Token length:", token.length)

    // Hash the token for comparison
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex")
    console.log(`[Password Reset] Token hash: ${resetTokenHash.substring(0, 20)}...`)

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if token is valid and not expired
    const now = new Date()
    console.log(`[Password Reset] Current time: ${now.toISOString()}`)

    const user = await usersCollection.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpiry: { $gt: now },
    })

    if (!user) {
      console.warn("[Password Reset] ❌ Token verification failed")
      console.warn("[Password Reset] Possible reasons:")
      console.warn("  - Token not found in database")
      console.warn("  - Token has expired")
      console.warn("  - Token is invalid")

      // Check if token exists but is expired (for better error messaging)
      const expiredTokenUser = await usersCollection.findOne({
        passwordResetToken: resetTokenHash,
      })

      if (expiredTokenUser) {
        console.warn(`[Password Reset] Token exists but is expired`)
        console.warn(`[Password Reset] Token expiry: ${expiredTokenUser.passwordResetExpiry?.toISOString()}`)
      }

      return NextResponse.json(
        { valid: false, error: "Invalid or expired password reset token" },
        { status: 400 },
      )
    }

    console.log(`[Password Reset] ✅ Token verified successfully`)
    console.log(`[Password Reset]    - Email: ${user.email}`)
    console.log(`[Password Reset]    - Token expires: ${user.passwordResetExpiry?.toISOString()}`)
    console.log(`[Password Reset]    - Time remaining: ${((user.passwordResetExpiry?.getTime() || 0) - now.getTime()) / 1000 / 60} minutes`)

    return NextResponse.json({ valid: true, email: user.email }, { status: 200 })
  } catch (error) {
    console.error("[Password Reset] ❌ Verification error:", error)
    if (error instanceof Error) {
      console.error(`[Password Reset] Error message: ${error.message}`)
      console.error(`[Password Reset] Error stack: ${error.stack}`)
    }
    return NextResponse.json(
      { valid: false, error: "Internal server error during verification" },
      { status: 500 },
    )
  }
}