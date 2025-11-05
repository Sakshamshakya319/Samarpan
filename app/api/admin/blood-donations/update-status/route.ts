import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * Update blood donation status
 * Status Flow: accepted → transportation_needed → image_uploaded → fulfilled
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || !["admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const db = await getDatabase()
    const { acceptanceId, newStatus, needsTransportation } = await request.json()

    if (!acceptanceId || !newStatus) {
      return NextResponse.json(
        { error: "Acceptance ID and new status are required" },
        { status: 400 }
      )
    }

    const acceptedBloodRequestsCollection = db.collection("acceptedBloodRequests")
    const notificationsCollection = db.collection("notifications")

    // Get the acceptance record
    const acceptance = await acceptedBloodRequestsCollection.findOne({
      _id: new ObjectId(acceptanceId),
    })

    if (!acceptance) {
      return NextResponse.json(
        { error: "Acceptance record not found" },
        { status: 404 }
      )
    }

    // Update the acceptance record with new status
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    }

    if (needsTransportation !== undefined) {
      updateData.needsTransportation = needsTransportation
    }

    const updateResult = await acceptedBloodRequestsCollection.updateOne(
      { _id: new ObjectId(acceptanceId) },
      { $set: updateData }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 400 }
      )
    }

    // Create notification for user based on status
    let notificationMessage = ""
    let notificationTitle = ""

    switch (newStatus) {
      case "transportation_needed":
        notificationTitle = "Transportation Arranged"
        notificationMessage = `Transportation has been arranged for your blood donation. We'll pick you up from your location.`
        break
      case "image_uploaded":
        notificationTitle = "Donation Image Received"
        notificationMessage = `Thank you! We've received the image of your blood donation. Admin is verifying it.`
        break
      case "fulfilled":
        notificationTitle = "Blood Donation Fulfilled ✓"
        notificationMessage = `Your blood donation has been successfully completed and delivered to the patient. Thank you for saving lives!`
        break
    }

    if (notificationMessage) {
      await notificationsCollection.insertOne({
        userId: acceptance.userId,
        title: notificationTitle,
        message: notificationMessage,
        status: newStatus,
        acceptanceId: new ObjectId(acceptanceId),
        read: false,
        createdAt: new Date(),
      })
    }

    return NextResponse.json(
      {
        message: "Status updated successfully",
        status: newStatus,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update blood donation status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}