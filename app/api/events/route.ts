import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

/**
 * Public Events API
 * Get all active events (read-only for users)
 */

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const eventsCollection = db.collection("events")

    // Get only active events, sorted by date
    const events = await eventsCollection
      .find({ status: "active" })
      .sort({ eventDate: 1 })
      .toArray()

    // Format events for frontend
    const formattedEvents = events.map((event: any) => ({
      _id: event._id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      expectedAttendees: event.expectedAttendees,
      eventType: event.eventType,
      imageUrl: event.imageUrl || "",
    }))

    return NextResponse.json({
      events: formattedEvents,
      total: formattedEvents.length,
    })
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}