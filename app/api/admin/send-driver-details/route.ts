import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

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
    const { userId, driverName, driverPhone, vehicleInfo, pickupTime } = await request.json()

    if (!userId || !driverName || !driverPhone) {
      return NextResponse.json(
        { error: "Missing required fields: userId, driverName, driverPhone" },
        { status: 400 }
      )
    }

    const notificationsCollection = db.collection("notifications")

    const notificationData = {
      userId: new ObjectId(userId),
      type: "driver_details",
      title: "Driver Details - Your Transportation",
      message: `Your driver is ready for pickup!`,
      driverDetails: {
        name: driverName,
        phone: driverPhone,
        vehicleInfo: vehicleInfo || "",
        pickupTime: pickupTime || "",
      },
      read: false,
      createdAt: new Date(),
    }

    const result = await notificationsCollection.insertOne(notificationData)

    return NextResponse.json(
      {
        message: "Driver details notification sent successfully",
        notificationId: result.insertedId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Send driver details error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}