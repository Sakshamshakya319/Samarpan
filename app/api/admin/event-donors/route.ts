import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
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

    const decoded = verifyAdminToken(token)
    if (!decoded || !["admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")
    const eventsCollection = db.collection("events")

    // Fetch event metadata so admins can see event name and details
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })

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
            name: { $ifNull: ["$name", "Unknown"] },
            email: { $ifNull: ["$user.email", { $ifNull: ["$email", ""] }] },
            phone: { $ifNull: ["$user.phone", { $ifNull: ["$phone", ""] }] },
            registrationNumber: { $ifNull: ["$registrationNumber", ""] },
            timeSlot: { $ifNull: ["$timeSlot", ""] },
            tokenVerified: { $ifNull: ["$tokenVerified", false] },
            donationStatus: { $ifNull: ["$donationStatus", "Pending"] },
            verifiedAt: "$verifiedAt",
            verifiedBy: "$verifiedBy",
            createdAt: "$createdAt",
            bloodType: "$bloodType",
            bloodTestCompleted: { $ifNull: ["$bloodTestCompleted", false] },
            bloodTestUpdatedAt: "$bloodTestUpdatedAt",
            bloodTestUpdatedBy: "$bloodTestUpdatedBy",
            userBloodGroup: "$user.bloodGroup",
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
        completedCount: donors.filter((d: any) => d.tokenVerified).length,
        pendingCount: donors.filter((d: any) => !d.tokenVerified).length,
        event: event
          ? {
              _id: event._id,
              title: event.title,
              description: event.description,
              eventDate: event.eventDate,
              startTime: event.startTime,
              endTime: event.endTime,
              location: event.location,
              expectedAttendees: event.expectedAttendees,
              eventType: event.eventType,
              status: event.status,
            }
          : null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get event donors error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}