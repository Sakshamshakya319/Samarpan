import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const db = await getDatabase()
    const { status } = await request.json()

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const donationImagesCollection = db.collection("donationImages")
    const result = await donationImagesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
          updatedBy: new ObjectId(decoded.adminId),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Create notification for user
    const image = await donationImagesCollection.findOne({ _id: new ObjectId(id) })
    if (image && image.userId) {
      const notificationsCollection = db.collection("notifications")
      const message =
        status === "approved"
          ? "Your donation image has been verified and approved."
          : "Your donation image was not verified. Please contact admin for more details."

      await notificationsCollection.insertOne({
        userId: image.userId,
        title: `Donation Image ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message,
        read: false,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({
      message: `Image ${status} successfully`,
    })
  } catch (error) {
    console.error("Update donation image error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}