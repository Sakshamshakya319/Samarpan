import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { sendEmail, generateBloodRequestEmailHTML } from "@/lib/email"
import { sendWhatsAppBulk } from "@/lib/whatsapp"
import { ObjectId } from "mongodb"
import { verifyAdminPermission } from "@/lib/admin-utils-server"

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

    // Verify user exists
    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { 
      bloodGroup, 
      quantity, 
      urgency, 
      reason, 
      hospitalLocation,
      requestType = "self",
      patientName,
      patientPhone,
      hospitalDocumentImage,
      hospitalDocumentFileName,
    } = await request.json()

    if (!bloodGroup || !quantity || !hospitalLocation) {
      return NextResponse.json({ error: "Blood group, quantity, and hospital location are required" }, { status: 400 })
    }

    if (!hospitalDocumentImage) {
      return NextResponse.json({ error: "Hospital document image is required" }, { status: 400 })
    }

    if (requestType === "others") {
      if (!patientName || !patientPhone) {
        return NextResponse.json({ error: "Patient name and phone are required when requesting for others" }, { status: 400 })
      }
    }

    const bloodRequestsCollection = db.collection("bloodRequests")
    const result = await bloodRequestsCollection.insertOne({
      userId: new ObjectId(decoded.userId),
      userName: user.name || "Unknown",
      userEmail: user.email,
      userPhone: user.phone || "",
      requestType: requestType || "self",
      patientName: requestType === "others" ? patientName : null,
      patientPhone: requestType === "others" ? patientPhone : null,
      bloodGroup,
      quantity,
      urgency: urgency || "normal", // low, normal, high, critical
      reason: reason || "",
      hospitalLocation,
      hospitalDocumentImage,
      hospitalDocumentFileName,
      status: "active", // active, fulfilled, cancelled
      verified: false, // document needs to be verified by admin
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Send email notifications to users with the same blood group
    console.log(`[Blood Request] Finding users with blood group ${bloodGroup}...`)
    const matchingUsers = await usersCollection
      .find({ bloodGroup: bloodGroup, _id: { $ne: new ObjectId(decoded.userId) } })
      .toArray()

    if (matchingUsers.length > 0) {
      const emailAddresses = matchingUsers.map((u) => u.email).filter((email) => email)
      console.log(`[Blood Request] Sending emails to ${emailAddresses.length} users with ${bloodGroup} blood group`)

      // Generate email HTML
      const emailHTML = generateBloodRequestEmailHTML({
        bloodGroup,
        quantity,
        urgency: urgency || "normal",
        reason: reason || "",
        hospitalLocation,
        userName: user.name || "Unknown",
        userPhone: user.phone || "",
        userEmail: user.email,
      })

      // Send emails asynchronously (don't block the response)
      sendEmail({
        to: emailAddresses,
        subject: `🩸 Blood Request - ${bloodGroup} Needed (${urgency?.toUpperCase() || "NORMAL"} URGENCY)`,
        html: emailHTML,
      }).catch((err) => {
        console.error("[Blood Request] Error sending emails:", err)
      })

      // Create database notifications for matching users
      const notificationsCollection = db.collection("notifications")
      const notifications = matchingUsers.map((u) => ({
        userId: u._id,
        title: `Blood Request - ${bloodGroup} Needed`,
        message: `A blood donation request for ${bloodGroup} blood type has been posted for ${hospitalLocation}. Urgency: ${urgency || "Normal"}`,
        type: "blood_request",
        relatedRequestId: result.insertedId,
        read: false,
        createdAt: new Date(),
      }))

      if (notifications.length > 0) {
        await notificationsCollection.insertMany(notifications)
        console.log(`[Blood Request] Created ${notifications.length} in-app notifications`)
      }

      // Send WhatsApp notifications to matching users (best-effort)
      try {
        const phones = matchingUsers
          .map((u) => u.phone)
          .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
        if (phones.length > 0) {
          const text = `Blood Request - ${bloodGroup} Needed\n\nLocation: ${hospitalLocation}\nUrgency: ${urgency || "Normal"}\nQuantity: ${quantity}\nReason: ${reason || "N/A"}`
          const { sent, failed } = await sendWhatsAppBulk(phones, text)
          console.log(`[Blood Request] WhatsApp sent=${sent} failed=${failed}`)
        }
      } catch (waErr) {
        console.error("[Blood Request] WhatsApp send error:", waErr)
      }
    }

    return NextResponse.json(
      {
        message: "Blood request created successfully",
        requestId: result.insertedId,
        notificationsCount: matchingUsers.length,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create blood request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if this is an admin token first
    const adminVerification = await verifyAdminPermission(request)
    const isAdmin = adminVerification.valid
    
    let userId: string | null = null
    
    if (!isAdmin) {
      // If not admin, verify as regular user token
      const token = request.headers.get("authorization")?.split(" ")[1]
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      
      const decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
      userId = decoded.userId
    }

    // Check if user wants to get own requests or all active requests
    const url = new URL(request.url)
    const getAllRequests = url.searchParams.get("all") === "true"

    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")

    if (getAllRequests) {
      // Get all active blood requests (for donation page or admin)
      const allRequests = await bloodRequestsCollection
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .toArray()
      return NextResponse.json({ requests: allRequests })
    } else if (isAdmin) {
      // Admin can see all requests (all statuses)
      const allRequests = await bloodRequestsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray()
      return NextResponse.json({ requests: allRequests })
    } else {
      // Get user's own blood requests
      const userRequests = await bloodRequestsCollection
        .find({ userId: new ObjectId(userId!) })
        .sort({ createdAt: -1 })
        .toArray()
      return NextResponse.json({ requests: userRequests })
    }
  } catch (error) {
    console.error("Get blood requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}