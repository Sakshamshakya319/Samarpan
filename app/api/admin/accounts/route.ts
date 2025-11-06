import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminPermission } from "@/lib/admin-utils"
import { hashPassword } from "@/lib/auth"
import { ADMIN_PERMISSIONS } from "@/lib/constants/admin-permissions"

/**
 * GET /api/admin/accounts
 * List all admin accounts (superadmin only)
 */
export async function GET(request: NextRequest) {
  const verification = await verifyAdminPermission(request)

  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status || 401 },
    )
  }

  // Only superadmin can view all accounts
  if (verification.admin.role !== "superadmin") {
    return NextResponse.json(
      { error: "Forbidden - Only superadmin can view all admin accounts" },
      { status: 403 },
    )
  }

  try {
    const db = await getDatabase()
    const adminsCollection = db.collection("admins")

    const accounts = await adminsCollection
      .find({}, { projection: { password: 0 } })
      .toArray()

    return NextResponse.json(
      {
        message: "Admin accounts retrieved successfully",
        accounts,
        total: accounts.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching admin accounts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/accounts
 * Create a new admin account (superadmin only)
 */
export async function POST(request: NextRequest) {
  const verification = await verifyAdminPermission(request)

  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status || 401 },
    )
  }

  // Only superadmin can create accounts
  if (verification.admin.role !== "superadmin") {
    return NextResponse.json(
      { error: "Forbidden - Only superadmin can create admin accounts" },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()

    const {
      email,
      password,
      name,
      permissions = [],
      isNgoAccount = false,
    } = body as {
      email?: string
      password?: string
      name?: string
      permissions?: string[]
      isNgoAccount?: boolean
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 },
      )
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions must be an array" },
        { status: 400 },
      )
    }

    const ngoPermission = ADMIN_PERMISSIONS.MANAGE_EVENT_DONATION_BLOOD_LABELS
    const eventDonorPermission = ADMIN_PERMISSIONS.VIEW_EVENT_DONORS

    let sanitizedPermissions = permissions.filter((perm) => typeof perm === "string")

    if (isNgoAccount) {
      sanitizedPermissions = Array.from(
        new Set([...sanitizedPermissions, ngoPermission, eventDonorPermission]),
      )
    } else {
      sanitizedPermissions = sanitizedPermissions.filter(
        (perm) => perm !== ngoPermission,
      )
    }

    const db = await getDatabase()
    const adminsCollection = db.collection("admins")

    // Check if admin already exists
    const existingAdmin = await adminsCollection.findOne({ email })
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 409 },
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new admin account
    const newAdmin = {
      email,
      password: hashedPassword,
      name,
      role: "admin",
      permissions: sanitizedPermissions,
      isNgoAccount,
      status: "active",
      createdBy: verification.admin._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await adminsCollection.insertOne(newAdmin)

    return NextResponse.json(
      {
        message: "Admin account created successfully",
        admin: {
          id: result.insertedId,
          email,
          name,
          role: "admin",
          permissions: sanitizedPermissions,
          isNgoAccount,
          status: "active",
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating admin account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}