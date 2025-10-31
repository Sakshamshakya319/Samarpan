import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword } from "@/lib/auth"
import crypto from "crypto"

interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
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

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      )
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
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          passwordResetToken: "",
          passwordResetExpiry: "",
        },
      },
    )

    console.log(`[Password Reset] Password successfully reset for user: ${user.email}`)
    return NextResponse.json(
      { message: "Password reset successful. You can now login with your new password." },
      { status: 200 },
    )
  } catch (error) {
    console.error("[Password Reset] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
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