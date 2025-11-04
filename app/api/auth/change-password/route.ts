import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, verifyPassword, verifyToken, verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * Validates password strength requirements
 * - Minimum 8 characters, maximum 128 characters
 * - Must contain uppercase, lowercase, and number
 */
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

/**
 * Extract bearer token from Authorization header
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * POST /api/auth/change-password
 * 
 * Change password for authenticated users and admins
 * 
 * Request body:
 * {
 *   currentPassword: string
 *   newPassword: string
 *   confirmPassword: string
 * }
 * 
 * Response:
 * - 200: Password changed successfully
 * - 400: Validation error (missing fields, weak password, mismatched new passwords)
 * - 401: Authentication error (invalid token, incorrect current password)
 * - 404: User/admin not found
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ChangePasswordRequest = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Extract and validate token
    const token = extractToken(request)
    if (!token) {
      console.warn("[Change Password] Missing or invalid Authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Change Password] Processing password change request")

    // Validate input fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      console.warn("[Change Password] Missing required fields")
      return NextResponse.json(
        { error: "Current password, new password, and confirmation are required" },
        { status: 400 }
      )
    }

    // Validate new password format
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      console.warn(`[Change Password] Password validation failed: ${passwordValidation.error}`)
      return NextResponse.json(
        { error: passwordValidation.error || "Invalid password" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      console.warn("[Change Password] New passwords do not match")
      return NextResponse.json({ error: "New passwords do not match" }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      console.warn("[Change Password] New password is same as current password")
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      )
    }

    // Determine if this is a user or admin by checking token type
    let userId: string | null = null
    let isAdmin = false
    let userEmail = ""

    // Try user token first
    const userToken = verifyToken(token)
    if (userToken?.userId) {
      userId = userToken.userId
      userEmail = userToken.email || ""
      console.log("[Change Password] Request is from regular user")
    } else {
      // Try admin token
      const adminToken = verifyAdminToken(token)
      if (adminToken?.adminId) {
        userId = adminToken.adminId
        userEmail = adminToken.email || ""
        isAdmin = true
        console.log("[Change Password] Request is from admin user")
      }
    }

    if (!userId) {
      console.warn("[Change Password] Invalid or expired token")
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Connect to database
    const db = await getDatabase()
    const collection = isAdmin ? db.collection("admins") : db.collection("users")

    // Find user/admin
    let user
    try {
      user = await collection.findOne({
        _id: new ObjectId(userId),
      })
    } catch (error) {
      console.error("[Change Password] Invalid user ID format:", userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user) {
      console.warn(`[Change Password] ${isAdmin ? "Admin" : "User"} not found: ${userId}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`[Change Password] ${isAdmin ? "Admin" : "User"} found: ${user.email}`)

    // Verify current password matches what's stored
    console.log("[Change Password] Verifying current password...")
    const passwordMatch = await verifyPassword(currentPassword, user.password)

    if (!passwordMatch) {
      console.warn("[Change Password] Current password is incorrect")
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    console.log("[Change Password] Current password verified successfully")

    // Hash new password
    console.log("[Change Password] Hashing new password...")
    const hashedPassword = await hashPassword(newPassword)

    // Update password in database
    console.log(
      `[Change Password] Updating password for ${isAdmin ? "admin" : "user"}: ${user._id}`
    )
    const updateResult = await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
          passwordChangedAt: new Date(),
        },
      }
    )

    console.log(`[Change Password] Update result:`)
    console.log(`[Change Password]    - Matched: ${updateResult.matchedCount}`)
    console.log(`[Change Password]    - Modified: ${updateResult.modifiedCount}`)

    if (updateResult.modifiedCount === 0) {
      console.error("[Change Password] Failed to update password in database")
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 }
      )
    }

    console.log(`[Change Password] ✅ Password successfully changed`)
    console.log(`[Change Password]    - Type: ${isAdmin ? "Admin" : "User"}`)
    console.log(`[Change Password]    - Email: ${user.email}`)
    console.log(`[Change Password]    - Timestamp: ${new Date().toISOString()}`)

    return NextResponse.json(
      { message: "Password changed successfully!" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Change Password] Unexpected error:", error)
    if (error instanceof Error) {
      console.error(`[Change Password] Error details: ${error.message}`)
      console.error(`[Change Password] Stack: ${error.stack}`)
    }
    return NextResponse.json(
      { error: "Failed to change password. Please try again later." },
      { status: 500 }
    )
  }
}