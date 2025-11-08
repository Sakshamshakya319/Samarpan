import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth"
import { sendWhatsAppNotification } from "@/lib/whatsapp"

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { pickupLocation, pickupCoordinates } = await request.json()

    if (!pickupLocation) {
      return NextResponse.json({ error: "Missing pickup location" }, { status: 400 })
    }

    const db = await getDatabase()
    const transportationCollection = db.collection("transportationRequests")
    const notificationsCollection = db.collection("notifications")

    // Find the user's most recent transportation request that is pending
    const transportationRequest = await transportationCollection.findOne({
      userId: new ObjectId(decoded.userId),
      status: "pending"
    })

    if (!transportationRequest) {
      return NextResponse.json({ 
        error: "No pending transportation request found. You can only update pickup location for pending requests." 
      }, { status: 404 })
    }

    // Update the pickup location
    const updateData: any = {
      pickupLocation,
      updatedAt: new Date(),
    }

    if (pickupCoordinates) {
      updateData.pickupCoordinates = {
        latitude: pickupCoordinates.latitude,
        longitude: pickupCoordinates.longitude
      }
    }

    const result = await transportationCollection.updateOne(
      { _id: transportationRequest._id },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to update pickup location" }, { status: 400 })
    }

    // Create notification for user
    await notificationsCollection.insertOne({
      userId: new ObjectId(decoded.userId),
      title: "Pickup Location Updated",
      message: `Your pickup location has been updated to: ${pickupLocation}`,
      read: false,
      createdAt: new Date(),
    })

    // Send WhatsApp notification (best-effort)
    try {
      const usersCollection = db.collection("users")
      const userDoc = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
      if (userDoc?.phone) {
        await sendWhatsAppNotification({
          phone: userDoc.phone,
          title: "Pickup Location Updated",
          message: `Your pickup location has been updated to: ${pickupLocation}`,
        })
      }
    } catch (waErr) {
      console.error("[Update Pickup Location] WhatsApp send error:", waErr)
    }

    return NextResponse.json({
      message: "Pickup location updated successfully",
      pickupLocation,
    })

  } catch (error) {
    console.error("Update pickup location error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}