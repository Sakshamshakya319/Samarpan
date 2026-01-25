import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { sendEmail, generateNotificationEmailHTML } from "@/lib/email"
import { sendWhatsAppBulk } from "@/lib/whatsapp"
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

    let emailsSent = 0

    if (recipientUsers.length > 0) {
      // Create database notifications for dashboard
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
        console.log(`[Admin Notification] Sending emails to ${recipientUsers.length} users`)

        // Send individual emails to each user for personalization
        const emailPromises = recipientUsers
          .filter(user => user.email) // Only users with email addresses
          .map(async (user) => {
            try {
              const emailHTML = generateNotificationEmailHTML({
                title,
                message,
                userName: user.name,
              })

              const emailSent = await sendEmail({
                to: user.email,
                subject: `Samarpan: ${title}`,
                html: emailHTML,
              })

              if (emailSent) {
                emailsSent++
              }
              return emailSent
            } catch (err) {
              console.error(`[Admin Notification] Failed to send email to ${user.email}:`, err)
              return false
            }
          })

        // Wait for all emails to be sent
        await Promise.all(emailPromises)
      }

      // Send WhatsApp to recipients who have phone numbers (best-effort)
      try {
        const phones = recipientUsers
          .map((u) => u.phone)
          .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
        if (phones.length > 0) {
          const text = `${title}\n\n${message}`
          const { sent, failed } = await sendWhatsAppBulk(phones, text)
          console.log(`[Admin Notification] WhatsApp sent=${sent} failed=${failed}`)
        }
      } catch (waErr) {
        console.error("[Admin Notification] WhatsApp send error:", waErr)
      }
    }

    return NextResponse.json(
      {
        message: "Notification sent successfully",
        recipientCount: recipientUsers.length,
        emailsSent: emailsSent,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Send notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
