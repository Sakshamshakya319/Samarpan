import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

/**
 * Public Events API
 * Get all active events (read-only for users)
 * Supports filtering by single event ID via ?id=eventId
 */

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const eventsCollection = db.collection("events")
    const registrationsCollection = db.collection("event_registrations")

    // Check if fetching single event by ID
    const url = new URL(request.url)
    const eventId = url.searchParams.get("id")

    let query: any = { status: "active" }
    if (eventId) {
      try {
        query._id = new ObjectId(eventId)
      } catch {
        return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
      }
    }

    // Get events based on query
    const events = await eventsCollection
      .find(query)
      .sort({ eventDate: 1 })
      .toArray()

    // Format events for frontend with registration count
    const formattedEvents = await Promise.all(
      events.map(async (event: any) => {
        const registrationCount = await registrationsCollection.countDocuments({
          eventId: event._id,
        })

        return {
          _id: event._id,
          title: event.title,
          description: event.description,
          eventDate: event.eventDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          expectedAttendees: event.expectedAttendees,
          volunteerSlotsNeeded: event.volunteerSlotsNeeded || 0,
          registeredVolunteers: registrationCount,
          eventType: event.eventType,
          imageUrl: event.imageUrl || "",
          allowRegistrations: event.allowRegistrations !== false, // Default to true if not specified
        }
      })
    )

    return NextResponse.json({
      events: formattedEvents,
      total: formattedEvents.length,
    })
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}