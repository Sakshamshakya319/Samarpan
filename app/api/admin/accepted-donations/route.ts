import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * Get all accepted blood donations with status tracking
 * Shows: who accepted, needs transportation, status, etc.
 */
export async function GET(request: NextRequest) {
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

    // Verify admin exists
    const admin = await db.collection("admins").findOne({
      _id: new ObjectId(decoded.adminId),
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const acceptedBloodRequestsCollection = db.collection("acceptedBloodRequests")
    const bloodRequestsCollection = db.collection("bloodRequests")

    // Get all accepted blood donations
    const acceptances = await acceptedBloodRequestsCollection
      .aggregate([
        {
          $lookup: {
            from: "bloodRequests",
            localField: "bloodRequestId",
            foreignField: "_id",
            as: "bloodRequest",
          },
        },
        {
          $unwind: {
            path: "$bloodRequest",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { acceptedAt: -1 },
        },
      ])
      .toArray()

    // Format the response with proper typing
    const formattedAcceptances = acceptances.map((acceptance: any) => ({
      _id: acceptance._id,
      acceptanceId: acceptance._id,
      userId: acceptance.userId,
      userName: acceptance.userName,
      userEmail: acceptance.userEmail,
      userPhone: acceptance.userPhone,
      bloodRequestId: acceptance.bloodRequestId,
      bloodGroup: acceptance.bloodGroup,
      quantity: acceptance.quantity,
      acceptedAt: acceptance.acceptedAt,
      status: acceptance.status || "accepted", // accepted, transportation_needed, image_uploaded, fulfilled
      needsTransportation: acceptance.needsTransportation || false,
      updatedAt: acceptance.updatedAt || acceptance.acceptedAt,
      // Blood request details
      bloodRequest: {
        reason: acceptance.bloodRequest?.reason,
        urgency: acceptance.bloodRequest?.urgency,
        createdAt: acceptance.bloodRequest?.createdAt,
      },
    }))

    return NextResponse.json({ requests: formattedAcceptances, total: formattedAcceptances.length })
  } catch (error) {
    console.error("Get accepted donations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}