import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

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

    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const donationRequestsCollection = db.collection("donationRequests")
    const acceptedRequestsCollection = db.collection("acceptedRequests")

    // Verify user exists
    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify request exists
    const donationRequest = await donationRequestsCollection.findOne({
      _id: new ObjectId(requestId),
    })

    if (!donationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Check if blood type matches
    if (user.bloodGroup !== donationRequest.bloodType) {
      return NextResponse.json(
        { error: `Your blood type (${user.bloodGroup}) does not match the required type (${donationRequest.bloodType})` },
        { status: 400 },
      )
    }

    // Check 3-month donation interval rule
    if (user.lastDonationDate) {
      const lastDonation = new Date(user.lastDonationDate)
      const today = new Date()
      const daysSinceLastDonation = Math.floor((today.getTime() - lastDonation.getTime()) / (1000 * 60 * 60 * 24))
      const monthsSinceLastDonation = daysSinceLastDonation / 30

      if (monthsSinceLastDonation < 3) {
        const daysRemaining = Math.ceil(90 - daysSinceLastDonation)
        return NextResponse.json(
          {
            error: `You cannot donate blood yet. Please wait at least 3 months between donations.`,
            warning: `Your last donation was ${daysSinceLastDonation} days ago. You can donate again in ${daysRemaining} days (after 3 months from your last donation).`,
            canDonate: false,
            daysRemaining,
            lastDonationDate: user.lastDonationDate,
          },
          { status: 400 },
        )
      }
    }

    // Check if user already accepted this request
    const existingAcceptance = await acceptedRequestsCollection.findOne({
      requestId: new ObjectId(requestId),
      userId: new ObjectId(decoded.userId),
    })

    if (existingAcceptance) {
      return NextResponse.json({ error: "You have already accepted this request" }, { status: 400 })
    }

    // Record the acceptance
    const result = await acceptedRequestsCollection.insertOne({
      requestId: new ObjectId(requestId),
      userId: new ObjectId(decoded.userId),
      userName: user.name,
      userEmail: user.email,
      bloodType: donationRequest.bloodType,
      acceptedAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Request accepted successfully",
        acceptanceId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Accept donation request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}