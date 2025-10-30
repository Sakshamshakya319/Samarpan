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
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const db = await getDatabase()
    const adminsCollection = db.collection("admins")
    const usersCollection = db.collection("users")

    // Verify admin exists
    const admin = await adminsCollection.findOne({
      _id: new ObjectId(decoded.adminId),
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const { userId, title, message, sendToAll, bloodType, sendToAccepted } = await request.json()

    const notificationsCollection = db.collection("notifications")

    if (sendToAll) {
      // Send to all users
      const allUsers = await usersCollection.find({}).toArray()
      const notifications = allUsers.map((user) => ({
        userId: user._id,
        title,
        message,
        read: false,
        createdAt: new Date(),
      }))
      await notificationsCollection.insertMany(notifications)
    } else if (bloodType && bloodType !== "all") {
      // Send to users with specific blood type
      const users = await usersCollection.find({ bloodGroup: bloodType }).toArray()
      const notifications = users.map((user) => ({
        userId: user._id,
        title,
        message,
        read: false,
        createdAt: new Date(),
      }))
      if (notifications.length > 0) {
        await notificationsCollection.insertMany(notifications)
      }
    } else if (sendToAccepted === true) {
      // Send to users who accepted blood donation requests
      const acceptedRequestsCollection = db.collection("acceptedRequests")
      const acceptedUsers = await acceptedRequestsCollection
        .find({})
        .project({ userId: 1 })
        .toArray()

      if (acceptedUsers.length > 0) {
        const userIds = acceptedUsers.map((ar) => ar.userId)
        const notifications = acceptedUsers.map((ar) => ({
          userId: ar.userId,
          title,
          message,
          read: false,
          createdAt: new Date(),
        }))
        await notificationsCollection.insertMany(notifications)
      }
    } else if (userId) {
      // Send to specific user
      await notificationsCollection.insertOne({
        userId: new ObjectId(userId),
        title,
        message,
        read: false,
        createdAt: new Date(),
      })
    } else {
      return NextResponse.json({ error: "No recipient specified" }, { status: 400 })
    }

    return NextResponse.json(
      {
        message: "Notification sent successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Send notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
