import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken, verifyToken } from "@/lib/auth"
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

    // Verify admin exists
    const admin = await adminsCollection.findOne({
      _id: new ObjectId(decoded.adminId),
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const { bloodType, quantity, urgency, reason } = await request.json()

    if (!bloodType || !quantity) {
      return NextResponse.json({ error: "Blood type and quantity are required" }, { status: 400 })
    }

    const donationRequestsCollection = db.collection("donationRequests")
    const result = await donationRequestsCollection.insertOne({
      bloodType,
      quantity,
      urgency: urgency || "normal", // low, normal, high, critical
      reason: reason || "",
      status: "active", // active, fulfilled, cancelled
      createdAt: new Date(),
      updatedAt: new Date(),
      adminId: new ObjectId(decoded.adminId),
    })

    return NextResponse.json(
      {
        message: "Donation request created successfully",
        requestId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create donation request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const donationRequestsCollection = db.collection("donationRequests")

    // Try to verify as admin first
    const adminDecoded = verifyAdminToken(token)
    if (adminDecoded && adminDecoded.role === "admin") {
      // Admin can see all active donation requests
      const admin = await db.collection("admins").findOne({
        _id: new ObjectId(adminDecoded.adminId),
      })

      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 })
      }

      const requests = await donationRequestsCollection
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .toArray()

      return NextResponse.json({ requests })
    }

    // Try to verify as regular user
    const userDecoded = verifyToken(token)
    if (userDecoded) {
      // Regular users can see all active donation requests to accept them
      const requests = await donationRequestsCollection
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .toArray()

      return NextResponse.json({ requests })
    }

    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  } catch (error) {
    console.error("Get donation requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}