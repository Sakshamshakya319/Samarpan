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

    let query: any = { status: "active", eventDate: { $gte: new Date() } }
    if (eventId) {
      try {
        query._id = new ObjectId(eventId)
        delete query.eventDate // Allow fetching a specific event even if it's in the past
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
        const donorCount = await registrationsCollection.countDocuments({
          eventId: event._id,
        })
        
        const volunteerCount = await db.collection("volunteer_registrations").countDocuments({
          eventId: event._id
        })

        const eventDate = new Date(event.eventDate)
        const isPastEvent = eventDate < new Date()

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
          registeredVolunteers: volunteerCount, // Corrected to count volunteers
          registeredDonors: donorCount,
          eventTypes: Array.isArray(event.eventTypes) ? event.eventTypes : [event.eventTypes || "donation_camp"], // Ensure it's always an array
          imageUrl: event.imageUrl || "",
          allowRegistrations: event.allowRegistrations !== false && !isPastEvent,
          isPast: isPastEvent,
          ngoName: event.ngoName || "", // NGO name
          ngoId: event.ngoId,
          ngoLogo: event.ngoLogo || "", // NGO logo URL
          ngoWebsite: event.ngoWebsite || "", // NGO website
          organizedBy: event.organizedBy || "", // Organized by description
          // Add participant categories and location type for dynamic registration
          locationType: event.locationType || "",
          participantCategories: event.participantCategories || [],
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