import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminPermission } from "@/lib/admin-utils-server"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify admin permission
    const adminVerification = await verifyAdminPermission(request)
    if (!adminVerification.valid) {
      return NextResponse.json({ error: adminVerification.error }, { status: adminVerification.status || 401 })
    }

    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")
    const result = await bloodRequestsCollection.deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Blood request not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Blood request deleted successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Delete blood request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify admin permission
    const adminVerification = await verifyAdminPermission(request)
    if (!adminVerification.valid) {
      return NextResponse.json({ error: adminVerification.error }, { status: adminVerification.status || 401 })
    }

    const { status } = await request.json()

    if (!status || !["active", "fulfilled", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")
    const result = await bloodRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Blood request not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Blood request status updated successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Update blood request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}