import { NextRequest, NextResponse } from "next/server"
import { verifyAdminPermission } from "@/lib/admin-utils-server"

export async function GET(request: NextRequest) {
  try {
    const verification = await verifyAdminPermission(request)
    
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error }, 
        { status: verification.status || 401 }
      )
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: verification.admin._id.toString(),
        email: verification.admin.email,
        name: verification.admin.name,
        role: verification.admin.role,
        permissions: verification.admin.permissions || [],
      },
      isSuperAdmin: verification.isSuperAdmin,
    })

  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}