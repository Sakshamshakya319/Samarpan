import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { verifyAdminPermission } from "@/lib/admin-utils-server"
import { ObjectId } from "mongodb"
import { sendWhatsAppNotification } from "@/lib/whatsapp"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // Robust admin verification: supports Authorization header or adminToken cookie
    const auth = await verifyAdminPermission(request)
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error || "Invalid token or insufficient permissions" }, { status: auth.status || 401 })
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
          updatedBy: new ObjectId(auth.admin._id),
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

      // Send WhatsApp to user (best-effort)
      try {
        const usersCollection = db.collection("users")
        const user = await usersCollection.findOne({ _id: image.userId })
        if (user?.phone) {
          await sendWhatsAppNotification({
            phone: user.phone,
            title: `Donation Image ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message,
          })
        }
      } catch (waErr) {
        console.error("[Donation Images] WhatsApp send error:", waErr)
      }
    }

    return NextResponse.json({
      message: `Image ${status} successfully`,
    })
  } catch (error) {
    console.error("Update donation image error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}