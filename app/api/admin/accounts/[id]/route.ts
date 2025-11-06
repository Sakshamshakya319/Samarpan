import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminPermission } from "@/lib/admin-utils"
import { hashPassword } from "@/lib/auth"
import { ADMIN_PERMISSIONS } from "@/lib/constants/admin-permissions"

/**
 * GET /api/admin/accounts/[id]
 * Get specific admin account details (superadmin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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
      { error: "Forbidden - Only superadmin can view admin account details" },
      { status: 403 },
    )
  }

  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid admin ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const adminsCollection = db.collection("admins")

    const admin = await adminsCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } },
    )

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Admin account retrieved successfully",
        admin,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching admin account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/accounts/[id]
 * Update admin account (superadmin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const verification = await verifyAdminPermission(request)

  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status || 401 },
    )
  }

  // Only superadmin can update accounts
  if (verification.admin.role !== "superadmin") {
    return NextResponse.json(
      { error: "Forbidden - Only superadmin can update admin accounts" },
      { status: 403 },
    )
  }

  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid admin ID" }, { status: 400 })
    }

    const { name, email, permissions, status, password } =
      await request.json()

    const db = await getDatabase()
    const adminsCollection = db.collection("admins")

    const adminId = new ObjectId(id)

    // Check if admin exists
    const admin = await adminsCollection.findOne({ _id: adminId })
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    // Prevent updating superadmin role
    if (admin.role === "superadmin") {
      return NextResponse.json(
        { error: "Cannot modify superadmin account" },
        { status: 403 },
      )
    }

    // If email is being changed, check if it already exists
    if (email && email !== admin.email) {
      const existingAdmin = await adminsCollection.findOne({ email })
      if (existingAdmin) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        )
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (name) updateData.name = name
    if (email) updateData.email = email
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return NextResponse.json(
          { error: "Permissions must be an array" },
          { status: 400 },
        )
      }
      updateData.permissions = permissions
    }
    if (status) updateData.status = status

    // If password is provided, hash it
    if (password) {
      updateData.password = await hashPassword(password)
    }

    const result = await adminsCollection.updateOne(
      { _id: adminId },
      { $set: updateData },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Admin account updated successfully",
        admin: {
          id: adminId,
          ...updateData,
          password: undefined, // Don't return password
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating admin account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/accounts/[id]
 * Delete admin account (superadmin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const verification = await verifyAdminPermission(request)

  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status || 401 },
    )
  }

  // Only superadmin can delete accounts
  if (verification.admin.role !== "superadmin") {
    return NextResponse.json(
      { error: "Forbidden - Only superadmin can delete admin accounts" },
      { status: 403 },
    )
  }

  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid admin ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const adminsCollection = db.collection("admins")

    const adminId = new ObjectId(id)

    // Check if admin exists
    const admin = await adminsCollection.findOne({ _id: adminId })
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    // Prevent deleting superadmin
    if (admin.role === "superadmin") {
      return NextResponse.json(
        { error: "Cannot delete superadmin account" },
        { status: 403 },
      )
    }

    const result = await adminsCollection.deleteOne({ _id: adminId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Admin account deleted successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error deleting admin account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}