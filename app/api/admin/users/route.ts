import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
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

    // Verify admin exists in admins collection
    const admin = await adminsCollection.findOne({
      _id: new ObjectId(decoded.adminId),
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    // Get query parameters for filtering
    const { bloodType, acceptedRequest } = Object.fromEntries(request.nextUrl.searchParams.entries())

    let query: any = {}

    // Filter by blood type if provided
    if (bloodType && bloodType !== "all") {
      query.bloodGroup = bloodType
    }

    // Get all users with their details
    let users = await usersCollection
      .find(query)
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray()

    // Filter by accepted requests if specified
    if (acceptedRequest === "true") {
      const acceptedRequestsCollection = db.collection("acceptedRequests")
      const acceptedUserIds = await acceptedRequestsCollection
        .find({})
        .project({ userId: 1 })
        .toArray()

      const acceptedIds = acceptedUserIds.map((ar) => ar.userId.toString())
      users = users.filter((user) => acceptedIds.includes(user._id.toString()))
    }

    return NextResponse.json({
      users,
      totalUsers: users.length,
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
