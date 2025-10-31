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

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Token, password, and confirmPassword are required" },
        { status: 400 },
      )
    }

    // Validate password format
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error || "Invalid password" },
        { status: 400 },
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    console.log("[Password Reset] Processing password reset with token")

    // Hash the token for comparison
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex")

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Find user with matching reset token and check expiry
    const user = await usersCollection.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpiry: { $gt: new Date() }, // Token must not be expired
    })

    if (!user) {
      console.log("[Password Reset] Invalid or expired token")
      return NextResponse.json(
        { error: "Invalid or expired password reset token. Please request a new one." },
        { status: 400 },
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update user password and clear reset token
    console.log(`[Password Reset] Resetting password for user: ${user._id}`)
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

    if (updateResult.modifiedCount === 0) {
      console.error("[Password Reset] Failed to update user password")
      return NextResponse.json(
        { error: "Failed to reset password. Please try again." },
        { status: 500 },
      )
    }

    console.log(`[Password Reset] Password successfully reset for user: ${user.email}`)
    return NextResponse.json(
      { message: "Password reset successful. You can now login with your new password." },
      { status: 200 },
    )
  } catch (error) {
    console.error("[Password Reset] Error:", error)
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

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    console.log("[Password Reset] Verifying reset token")

    // Hash the token for comparison
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex")

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if token is valid and not expired
    const user = await usersCollection.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpiry: { $gt: new Date() },
    })

    if (!user) {
      console.log("[Password Reset] Invalid or expired token verification")
      return NextResponse.json(
        { valid: false, error: "Invalid or expired password reset token" },
        { status: 400 },
      )
    }

    console.log("[Password Reset] Token verified successfully")
    return NextResponse.json({ valid: true, email: user.email }, { status: 200 })
  } catch (error) {
    console.error("[Password Reset] Verification error:", error)
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}