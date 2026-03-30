import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, verifyResetToken } from "@/lib/auth"

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

    // Verify the reset token using the new system
    const tokenData = verifyResetToken(token)
    if (!tokenData) {
      console.warn("[Password Reset] ❌ Invalid or expired token provided")
      return NextResponse.json(
        { error: "Invalid or expired password reset token. Please request a new one." },
        { status: 400 },
      )
    }

    console.log(`[Password Reset] Token hash: ${tokenData.tokenHash.substring(0, 20)}...`)

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const ngosCollection = db.collection("ngos")

    // Find user or NGO with matching reset token (using case-insensitive email search)
    let account: any = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${tokenData.email}$`, "i") },
      passwordResetToken: tokenData.tokenHash,
      passwordResetExpiry: { $gt: new Date() },
    })
    let collection = usersCollection
    let accountType = "user"

    if (!account) {
      // Check in ngos collection
      account = await ngosCollection.findOne({
        ngoEmail: { $regex: new RegExp(`^${tokenData.email}$`, "i") },
        passwordResetToken: tokenData.tokenHash,
        passwordResetExpiry: { $gt: new Date() },
      })
      if (account) {
        collection = ngosCollection
        accountType = "ngo"
      }
    }

    if (!account) {
      console.warn("[Password Reset] ❌ Account not found or token mismatch")
      return NextResponse.json(
        { error: "Invalid or expired password reset token. Please request a new one." },
        { status: 400 },
      )
    }

    const accountEmail = accountType === "user" ? account.email : account.ngoEmail
    console.log(`[Password Reset] ✅ Token verified for ${accountType}: ${accountEmail}`)
    console.log(`[Password Reset] Token expiry: ${account.passwordResetExpiry?.toISOString()}`)

    // Hash new password
    console.log("[Password Reset] Hashing new password...")
    const hashedPassword = await hashPassword(password)

    // Update account password and clear reset token
    console.log(`[Password Reset] Updating password for ${accountType}: ${account._id}`)
    const updateResult = await collection.updateOne(
      { _id: account._id },
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
      console.error(`[Password Reset] ❌ Failed to update ${accountType} password in database`)
      console.error(`[Password Reset] ${accountType} ID: ${account._id}`)
      return NextResponse.json(
        { error: "Failed to reset password. Please try again." },
        { status: 500 },
      )
    }

    console.log(`[Password Reset] ✅ Password successfully reset`)
    console.log(`[Password Reset]    - Email: ${accountEmail}`)
    console.log(`[Password Reset]    - Account Type: ${accountType}`)
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

    // Verify the reset token using the new system
    const tokenData = verifyResetToken(token)
    if (!tokenData) {
      console.warn("[Password Reset] ❌ Token verification failed")
      return NextResponse.json(
        { valid: false, error: "Invalid or expired password reset token" },
        { status: 400 },
      )
    }

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const ngosCollection = db.collection("ngos")

    // Check if token exists in database and is not expired
    let account = await usersCollection.findOne({
      email: tokenData.email,
      passwordResetToken: tokenData.tokenHash,
      passwordResetExpiry: { $gt: new Date() },
    })

    if (!account) {
      account = await ngosCollection.findOne({
        ngoEmail: tokenData.email,
        passwordResetToken: tokenData.tokenHash,
        passwordResetExpiry: { $gt: new Date() },
      })
    }

    if (!account) {
      console.warn("[Password Reset] ❌ Token not found in database for user or ngo")
      return NextResponse.json(
        { valid: false, error: "Invalid or expired password reset token" },
        { status: 400 },
      )
    }

    const accountEmail = account.email || account.ngoEmail
    console.log(`[Password Reset] ✅ Token verified successfully`)
    console.log(`[Password Reset]    - Email: ${accountEmail}`)
    console.log(`[Password Reset]    - Account Type: ${account.ngoEmail ? "ngo" : "user"}`)
    console.log(`[Password Reset]    - Token expires: ${account.passwordResetExpiry?.toISOString()}`)

    return NextResponse.json({ 
      valid: true, 
      email: accountEmail,
      accountType: account.ngoEmail ? "ngo" : "user"
    }, { status: 200 })
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