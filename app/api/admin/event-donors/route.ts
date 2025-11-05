import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * Admin Event Donors API
 * Fetch all donors who registered/participated in a specific event
 */

// GET: Get all donors for a specific event
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

    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")

    // Fetch all registrations for the event with user details
    const donors = await registrationsCollection
      .aggregate([
        {
          $match: {
            eventId: new ObjectId(eventId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: { $ifNull: ["$user.email", "$email"] },
            phone: { $ifNull: ["$user.phone", "$phone"] },
            registrationNumber: 1,
            timeSlot: 1,
            qrVerified: 1,
            donationStatus: 1,
            verifiedAt: 1,
            verifiedBy: 1,
            createdAt: 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray()

    return NextResponse.json(
      {
        donors: donors || [],
        total: donors.length,
        completedCount: donors.filter((d: any) => d.qrVerified).length,
        pendingCount: donors.filter((d: any) => !d.qrVerified).length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get event donors error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}