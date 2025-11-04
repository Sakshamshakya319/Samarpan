"use server"

import { NextResponse, type NextRequest } from "next/server"
import { verifyAdminToken } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { ADMIN_PERMISSIONS } from "@/lib/constants/admin-permissions"

export interface AdminTokenPayload {
  adminId: string
  role: string
  email: string
}

/**
 * Verify admin token and check permissions (SERVER-ONLY)
 */
export async function verifyAdminPermission(
  request: NextRequest,
  requiredPermission?: string,
) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get("authorization")
    let token = ""
    let tokenSource = ""

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7)
      tokenSource = "Authorization header (Bearer)"
    } else {
      token = request.cookies.get("adminToken")?.value || ""
      tokenSource = "adminToken cookie"
    }

    if (!token) {
      console.warn("[verifyAdminPermission] No token provided")
      return {
        valid: false,
        error: "Unauthorized - No token provided",
        status: 401,
      }
    }

    console.log(`[verifyAdminPermission] Token extracted from: ${tokenSource}`)
    console.log(`[verifyAdminPermission] Token length: ${token.length} characters`)
    console.log(`[verifyAdminPermission] Token first 50 chars: ${token.substring(0, 50)}...`)

    // Verify token
    const decoded = verifyAdminToken(token)
    if (!decoded) {
      console.warn("[verifyAdminPermission] Invalid token")
      return {
        valid: false,
        error: "Unauthorized - Invalid token",
        status: 401,
      }
    }

    console.log(`[verifyAdminPermission] Token decoded successfully`)
    console.log(`[verifyAdminPermission] Decoded payload:`, {
      adminId: decoded.adminId,
      role: decoded.role,
      email: decoded.email,
      keys: Object.keys(decoded),
    })

    if (!decoded.adminId) {
      // Check if this is a regular user token instead of admin token
      if ((decoded as any).userId) {
        console.error("[verifyAdminPermission] ❌ Regular user token detected - admin token required")
        return {
          valid: false,
          error: "Unauthorized - User token detected. Please log in as an admin.",
          status: 401,
        }
      }
      console.error("[verifyAdminPermission] ❌ Token missing adminId field")
      return {
        valid: false,
        error: "Unauthorized - Invalid token structure",
        status: 401,
      }
    }

    console.log(`[verifyAdminPermission] Token decoded for admin: ${decoded.email} (ID: ${decoded.adminId})`)

    // Get admin from database - convert string to ObjectId
    const db = await getDatabase()
    const adminsCollection = db.collection("admins")
    
    let admin = null
    
    // Try to find admin by ObjectId
    try {
      const objectId = new ObjectId(decoded.adminId)
      admin = await adminsCollection.findOne({ _id: objectId })
      
      if (admin) {
        console.log(`[verifyAdminPermission] ✅ Admin found by ObjectId: ${admin.email}`)
      }
    } catch (error) {
      console.warn(`[verifyAdminPermission] Failed to convert adminId to ObjectId: ${decoded.adminId}`, error)
    }

    // If not found by ObjectId, try by email as fallback
    if (!admin && decoded.email) {
      console.log(`[verifyAdminPermission] Trying to find admin by email: ${decoded.email}`)
      admin = await adminsCollection.findOne({ email: decoded.email })
      
      if (admin) {
        console.log(`[verifyAdminPermission] ✅ Admin found by email: ${admin.email}`)
      }
    }

    if (!admin) {
      console.error(`[verifyAdminPermission] ❌ Admin not found - ID: ${decoded.adminId}, Email: ${decoded.email}`)
      return {
        valid: false,
        error: "Unauthorized - Admin not found",
        status: 401,
      }
    }

    // Check if admin is superadmin (has all permissions)
    if (admin.role === "superadmin") {
      console.log(`[verifyAdminPermission] ✅ Superadmin access granted for: ${admin.email}`)
      return {
        valid: true,
        admin,
        isSuperAdmin: true,
      }
    }

    // Check specific permission if required
    if (requiredPermission) {
      const hasPermission = admin.permissions?.includes(requiredPermission)
      if (!hasPermission) {
        console.error(
          `[verifyAdminPermission] ❌ Permission denied for ${admin.email}: Missing '${requiredPermission}' permission. Current permissions: [${(admin.permissions || []).join(", ") || "none"}]`,
        )
        return {
          valid: false,
          error: `Forbidden - Permission '${requiredPermission}' required`,
          status: 403,
        }
      }
      console.log(`[verifyAdminPermission] ✅ Permission granted: ${requiredPermission}`)
    }

    console.log(`[verifyAdminPermission] ✅ Admin access granted for: ${admin.email}`)
    return {
      valid: true,
      admin,
      isSuperAdmin: false,
    }
  } catch (error) {
    console.error("[verifyAdminPermission] Verification error:", error)
    if (error instanceof Error) {
      console.error(`[verifyAdminPermission] Error details: ${error.message}`)
    }
    return {
      valid: false,
      error: "Internal server error",
      status: 500,
    }
  }
}