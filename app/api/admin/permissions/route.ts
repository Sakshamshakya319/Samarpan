import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminPermission } from "@/lib/admin-utils"
import {
  ADMIN_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
} from "@/lib/constants/admin-permissions"

/**
 * GET /api/admin/permissions
 * Get all available permissions (accessible to all authenticated admins)
 */
export async function GET(request: NextRequest) {
  const verification = await verifyAdminPermission(request)

  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status || 401 },
    )
  }

  try {
    // Format permissions with labels and groups
    const formattedPermissions = Object.entries(ADMIN_PERMISSIONS).map(
      ([key, value]) => ({
        id: value,
        key,
        label: PERMISSION_LABELS[value] || key,
      }),
    )

    // Format permission groups with proper name formatting
    const formattedGroups = Object.entries(PERMISSION_GROUPS).map(
      ([key, permissions]) => {
        // Convert snake_case to Title Case (user_management -> User Management)
        const name = key
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        return {
          id: key,
          name,
          permissions,
        }
      },
    )

    return NextResponse.json(
      {
        message: "Permissions retrieved successfully",
        permissions: formattedPermissions,
        groups: formattedGroups,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}