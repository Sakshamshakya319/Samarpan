import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { sendEmail, generateNotificationEmailHTML } from "@/lib/email"
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

    const { userId, title, message, sendToAll, bloodType, sendToAccepted, sendEmail: shouldSendEmail } = await request.json()

    const notificationsCollection = db.collection("notifications")
    let recipientUsers: any[] = []
    let recipientEmails: string[] = []

    if (sendToAll) {
      // Send to all users
      recipientUsers = await usersCollection.find({}).toArray()
    } else if (bloodType && bloodType !== "all") {
      // Send to users with specific blood type
      recipientUsers = await usersCollection.find({ bloodGroup: bloodType }).toArray()
    } else if (sendToAccepted === true) {
      // Send to users who accepted blood donation requests
      const acceptedRequestsCollection = db.collection("acceptedRequests")
      const acceptedUserIds = await acceptedRequestsCollection
        .find({})
        .project({ userId: 1 })
        .toArray()

      if (acceptedUserIds.length > 0) {
        const userIds = acceptedUserIds.map((ar) => ar.userId)
        recipientUsers = await usersCollection
          .find({ _id: { $in: userIds } })
          .toArray()
      }
    } else if (userId) {
      // Send to specific user
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
      if (user) {
        recipientUsers = [user]
      }
    } else {
      return NextResponse.json({ error: "No recipient specified" }, { status: 400 })
    }

    if (recipientUsers.length > 0) {
      // Create database notifications
      const notifications = recipientUsers.map((user) => ({
        userId: user._id,
        title,
        message,
        type: "admin_notification",
        read: false,
        createdAt: new Date(),
      }))
      await notificationsCollection.insertMany(notifications)

      // Send emails if requested
      if (shouldSendEmail) {
        recipientEmails = recipientUsers.map((u) => u.email).filter((email) => email)

        if (recipientEmails.length > 0) {
          console.log(`[Admin Notification] Sending emails to ${recipientEmails.length} users`)

          // Generate email HTML
          const emailHTML = generateNotificationEmailHTML({
            title,
            message,
          })

          // Send emails asynchronously
          sendEmail({
            to: recipientEmails,
            subject: title,
            html: emailHTML,
          }).catch((err) => {
            console.error("[Admin Notification] Error sending emails:", err)
          })
        }
      }
    }

    return NextResponse.json(
      {
        message: "Notification sent successfully",
        recipientCount: recipientUsers.length,
        emailsSent: recipientEmails.length,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Send notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
