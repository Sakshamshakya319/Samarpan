import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { sendEmail, generateNotificationEmailHTML } from "@/lib/email"
import { sendWhatsAppNotification } from "@/lib/whatsapp"
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

    const { userId, title, message, sendEmail: shouldSendEmail } = await request.json()

    // Fetch recipient user
    const recipientUser = await usersCollection.findOne({
      _id: new ObjectId(userId),
    })

    if (!recipientUser) {
      return NextResponse.json({ error: "Recipient user not found" }, { status: 404 })
    }

    const notificationsCollection = db.collection("notifications")
    const result = await notificationsCollection.insertOne({
      userId: new ObjectId(userId),
      title,
      message,
      type: "admin_notification",
      read: false,
      createdAt: new Date(),
    })

    // Send email if requested and user has email
    if (shouldSendEmail && recipientUser.email) {
      console.log(`[Notification] Sending email to ${recipientUser.email}`)

      const emailHTML = generateNotificationEmailHTML({
        title,
        message,
        userName: recipientUser.name,
      })

      // Send email asynchronously
      sendEmail({
        to: recipientUser.email,
        subject: title,
        html: emailHTML,
      }).catch((err) => {
        console.error("[Notification] Error sending email:", err)
      })
    }

    // Send WhatsApp (best-effort) if recipient has phone
    try {
      if (recipientUser.phone) {
        await sendWhatsAppNotification({
          phone: recipientUser.phone,
          title,
          message,
        })
      }
    } catch (waErr) {
      console.error("[Notification] WhatsApp send error:", waErr)
    }

    return NextResponse.json(
      {
        message: "Notification sent successfully",
        notificationId: result.insertedId,
        emailSent: shouldSendEmail && !!recipientUser.email,
        whatsappAttempted: !!recipientUser.phone,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Send notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
