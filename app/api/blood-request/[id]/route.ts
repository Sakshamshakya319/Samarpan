import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminPermission } from "@/lib/admin-utils-server"
import { ObjectId } from "mongodb"
import { sendWhatsAppNotification } from "@/lib/whatsapp"
import { sendEmail } from "@/lib/email"

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

    const { status, verified } = await request.json()

    const updateData: Record<string, any> = {}

    if (typeof status !== "undefined") {
      if (typeof status !== "string" || !["active", "fulfilled", "cancelled"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      updateData.status = status
    }

    if (typeof verified !== "undefined") {
      if (typeof verified !== "boolean") {
        return NextResponse.json({ error: "Invalid verified flag" }, { status: 400 })
      }
      updateData.verified = verified
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")
    const result = await bloodRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Blood request not found" }, { status: 404 })
    }

    // If status was changed to "fulfilled", notify all users who accepted this request
    if (status === "fulfilled") {
      try {
        const acceptedBloodRequestsCollection = db.collection("acceptedBloodRequests")
        const usersCollection = db.collection("users")
        const notificationsCollection = db.collection("notifications")

        // Get all users who accepted this blood request
        const acceptances = await acceptedBloodRequestsCollection.find({
          bloodRequestId: new ObjectId(id),
        }).toArray()

        // Get the blood request details for the notification
        const bloodRequest = await bloodRequestsCollection.findOne({ _id: new ObjectId(id) })

        if (acceptances.length > 0 && bloodRequest) {
          // Send notifications to all accepting users
          for (const acceptance of acceptances) {
            try {
              // Create in-app notification
              await notificationsCollection.insertOne({
                userId: acceptance.userId,
                title: "Blood Request Fulfilled",
                message: `The blood request you accepted has been fulfilled. Thank you for your willingness to donate! Your contribution helps save lives.`,
                read: false,
                createdAt: new Date(),
              })

              // Send email notification
              const user = await usersCollection.findOne({ _id: acceptance.userId })
              if (user?.email) {
                await sendEmail({
                  to: user.email,
                  subject: "Blood Request Fulfilled - Thank You for Your Support",
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #dc2626;">Blood Request Fulfilled</h2>
                      <p>Dear ${user.name || 'Valued Donor'},</p>
                      <p>The blood request you accepted has been successfully fulfilled. Thank you for your willingness to donate and for being part of our life-saving mission.</p>
                      <p><strong>Request Details:</strong></p>
                      <ul>
                        <li>Blood Group: ${bloodRequest.bloodGroup}</li>
                        <li>Quantity: ${bloodRequest.quantity} unit(s)</li>
                        <li>Urgency: ${bloodRequest.urgency}</li>
                        <li>Reason: ${bloodRequest.reason}</li>
                      </ul>
                      <p>Your commitment to helping others makes a real difference in our community. We appreciate your support and hope to see you again for future donation opportunities.</p>
                      <p>Stay healthy and keep saving lives!</p>
                      <br>
                      <p>Best regards,<br>The Samarpan Team</p>
                    </div>
                  `,
                })
              }

              // Send WhatsApp notification
              if (user?.phone) {
                await sendWhatsAppNotification({
                  phone: user.phone,
                  title: "Blood Request Fulfilled",
                  message: `The blood request you accepted has been fulfilled. Thank you for your willingness to donate! Your contribution helps save lives.`,
                })
              }
            } catch (notificationError) {
              console.error(`Failed to send notification to user ${acceptance.userId}:`, notificationError)
              // Continue with other users even if one fails
            }
          }
        }
      } catch (notificationError) {
        console.error("Error sending fulfillment notifications:", notificationError)
        // Don't fail the main request if notifications fail
      }
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