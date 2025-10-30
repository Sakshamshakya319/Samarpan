import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const notificationsCollection = db.collection("notifications")

    const notifications = await notificationsCollection
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can send notifications" }, { status: 403 })
    }

    const { userId, title, message } = await request.json()

    const notificationsCollection = db.collection("notifications")
    const result = await notificationsCollection.insertOne({
      userId: new ObjectId(userId),
      title,
      message,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Notification sent successfully",
        notificationId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Send notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
