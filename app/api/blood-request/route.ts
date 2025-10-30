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

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Verify user exists
    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { bloodGroup, quantity, urgency, reason, hospitalLocation } = await request.json()

    if (!bloodGroup || !quantity || !hospitalLocation) {
      return NextResponse.json({ error: "Blood group, quantity, and hospital location are required" }, { status: 400 })
    }

    const bloodRequestsCollection = db.collection("bloodRequests")
    const result = await bloodRequestsCollection.insertOne({
      userId: new ObjectId(decoded.userId),
      userName: user.name || "Unknown",
      userEmail: user.email,
      userPhone: user.phone || "",
      bloodGroup,
      quantity,
      urgency: urgency || "normal", // low, normal, high, critical
      reason: reason || "",
      hospitalLocation,
      status: "active", // active, fulfilled, cancelled
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Blood request created successfully",
        requestId: result.insertedId,
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
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check if user wants to get own requests or all active requests
    const url = new URL(request.url)
    const getAllRequests = url.searchParams.get("all") === "true"

    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")

    if (getAllRequests) {
      // Get all active blood requests (for donation page)
      const allRequests = await bloodRequestsCollection
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .toArray()
      return NextResponse.json({ requests: allRequests })
    } else {
      // Get user's own blood requests
      const userRequests = await bloodRequestsCollection
        .find({ userId: new ObjectId(decoded.userId) })
        .sort({ createdAt: -1 })
        .toArray()
      return NextResponse.json({ requests: userRequests })
    }
  } catch (error) {
    console.error("Get blood requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}