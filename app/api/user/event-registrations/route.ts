import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * User Event Registrations API
 * Get current user's event registrations with QR codes
 */

// GET: Get current user's event registrations
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")
    const eventsCollection = db.collection("events")

    // Get user's registrations
    const registrations = await registrationsCollection
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    // Enrich with event data
    const enrichedRegistrations = await Promise.all(
      registrations.map(async (registration) => {
        const event = await eventsCollection.findOne({
          _id: new ObjectId(registration.eventId),
        })

        return {
          ...registration,
          event: event
            ? {
                title: event.title,
                location: event.location,
                eventDate: event.eventDate,
                description: event.description,
              }
            : null,
        }
      })
    )

    return NextResponse.json({
      registrations: enrichedRegistrations,
      total: enrichedRegistrations.length,
    })
  } catch (error) {
    console.error("Get user registrations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}