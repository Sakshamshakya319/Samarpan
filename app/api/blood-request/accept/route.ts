import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

const DONATION_INTERVAL_DAYS = 90 // 3 months

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

    const { bloodRequestId, needsTransportation = false } = await request.json()

    if (!bloodRequestId) {
      return NextResponse.json({ error: "Blood request ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const bloodRequestsCollection = db.collection("bloodRequests")
    const acceptedBloodRequestsCollection = db.collection("acceptedBloodRequests")

    // Verify user exists and get their info
    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the blood request
    const bloodRequest = await bloodRequestsCollection.findOne({
      _id: new ObjectId(bloodRequestId),
    })

    if (!bloodRequest) {
      return NextResponse.json({ error: "Blood request not found" }, { status: 404 })
    }

    // Check if blood type matches
    if (bloodRequest.bloodGroup !== user.bloodGroup) {
      return NextResponse.json(
        { error: "Your blood type does not match this request" },
        { status: 400 }
      )
    }

    // Check if user already accepted this request
    const existingAcceptance = await acceptedBloodRequestsCollection.findOne({
      bloodRequestId: new ObjectId(bloodRequestId),
      userId: new ObjectId(decoded.userId),
    })

    if (existingAcceptance) {
      return NextResponse.json(
        { error: "You have already accepted this blood request" },
        { status: 400 }
      )
    }

    // **3-Month Validation: Check if user can donate**
    if (user.lastDonationDate) {
      const lastDonationDate = new Date(user.lastDonationDate)
      const today = new Date()
      const daysSinceLastDonation = Math.floor(
        (today.getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastDonation < DONATION_INTERVAL_DAYS) {
        const daysRemaining = DONATION_INTERVAL_DAYS - daysSinceLastDonation
        return NextResponse.json(
          {
            canDonate: false,
            error: "You cannot donate blood yet",
            warning: `Please wait at least ${daysRemaining} more day${daysRemaining !== 1 ? "s" : ""} before donating again. Days since last donation: ${daysSinceLastDonation}.`,
            daysRemaining,
            lastDonationDate: user.lastDonationDate,
          },
          { status: 400 }
        )
      }
    }

    // Record acceptance with status tracking
    const result = await acceptedBloodRequestsCollection.insertOne({
      bloodRequestId: new ObjectId(bloodRequestId),
      userId: new ObjectId(decoded.userId),
      userName: user.name || "Unknown",
      userEmail: user.email,
      userPhone: user.phone || "",
      bloodGroup: bloodRequest.bloodGroup,
      quantity: bloodRequest.quantity,
      acceptedAt: new Date(),
      status: "accepted", // accepted → transportation_needed → image_uploaded → fulfilled
      needsTransportation: needsTransportation, // User can request transportation
      updatedAt: new Date(),
    })

    // Send notifications to all users about the blood request acceptance
    try {
      const allUsers = await usersCollection.find({}).toArray()
      const notificationsCollection = db.collection("notifications")
      
      // Create in-app notifications for all users
      const notifications = allUsers.map(user => ({
        userId: user._id,
        title: "Blood Request Accepted",
        message: `A blood request for ${bloodRequest.bloodGroup} blood has been accepted by ${user.name || 'a donor'}. Thank you for your interest in helping!`,
        read: false,
        createdAt: new Date(),
        type: "blood_request_accepted",
        relatedId: bloodRequestId
      }))
      
      await notificationsCollection.insertMany(notifications)

      // Send email notifications to users who have email addresses
      const usersWithEmail = allUsers.filter(u => u.email)
      if (usersWithEmail.length > 0) {
        const { sendEmailNotification } = await import("@/lib/email")
        await Promise.allSettled(
          usersWithEmail.map(user => 
            sendEmailNotification({
              to: user.email,
              subject: "Blood Request Accepted",
              text: `A blood request for ${bloodRequest.bloodGroup} blood has been accepted. Thank you for your interest in helping save lives!`,
              html: `<p>A blood request for <strong>${bloodRequest.bloodGroup}</strong> blood has been accepted by a donor.</p><p>Thank you for your interest in helping save lives!</p>`
            })
          )
        )
      }

      // Send WhatsApp notifications to users who have phone numbers
      const usersWithPhone = allUsers.filter(u => u.phone)
      if (usersWithPhone.length > 0) {
        const { sendWhatsAppNotification } = await import("@/lib/whatsapp")
        await Promise.allSettled(
          usersWithPhone.map(user => 
            sendWhatsAppNotification({
              phone: user.phone,
              title: "Blood Request Accepted",
              message: `A blood request for ${bloodRequest.bloodGroup} blood has been accepted by a donor. Thank you for your willingness to help!`
            })
          )
        )
      }
    } catch (notificationError) {
      console.error("Error sending notifications:", notificationError)
      // Don't fail the main request if notifications fail
    }

    // Update blood request status if needed (optional - can be marked as fulfilled)
    // For now, we'll leave it as active so multiple donors can accept if needed

    // If user requested transportation, automatically create a transportation request
    if (needsTransportation) {
      try {
        const transportationCollection = db.collection("transportationRequests")
        
        await transportationCollection.insertOne({
          userId: new ObjectId(decoded.userId),
          bloodRequestId: new ObjectId(bloodRequestId),
          pickupLocation: "To be provided by donor", // User will update this later
          dropLocation: bloodRequest.hospitalLocation,
          hospitalLocation: bloodRequest.hospitalLocation,
          hospitalName: bloodRequest.hospitalName || "",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: new ObjectId(decoded.userId), // User created this transport request
        })

        // Create notification for user about transportation request
        await notificationsCollection.insertOne({
          userId: new ObjectId(decoded.userId),
          title: "Transportation Request Created",
          message: "A transportation request has been created for your blood donation. Please update your pickup location.",
          read: false,
          createdAt: new Date(),
        })
      } catch (transportError) {
        console.error("Error creating transportation request:", transportError)
        // Don't fail the main request if transportation creation fails
      }
    }

    return NextResponse.json(
      {
        message: "Blood request accepted successfully!",
        acceptanceId: result.insertedId,
        requestId: bloodRequestId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Accept blood request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}