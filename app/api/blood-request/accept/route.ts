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

    const { bloodRequestId } = await request.json()

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
      needsTransportation: false, // Admin will set this when creating transport request
      updatedAt: new Date(),
    })

    // Update blood request status if needed (optional - can be marked as fulfilled)
    // For now, we'll leave it as active so multiple donors can accept if needed

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