import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * Event Registrations API
 * Users register for events as volunteers
 */

interface RegistrationData {
  eventId: string
  registrationNumber: string
  name: string
  timeSlot: string // e.g., "09:00-11:00", "11:00-13:00", etc.
  userId?: string
  email?: string
}

// POST: User registers for an event
export async function POST(request: NextRequest) {
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
    const { eventId, registrationNumber, name, timeSlot } = (await request.json()) as RegistrationData

    // Validation
    if (!eventId || !registrationNumber || !name || !timeSlot) {
      return NextResponse.json(
        { error: "Event ID, registration number, name, and time slot are required" },
        { status: 400 }
      )
    }

    // Check if event exists and has available slots
    const eventsCollection = db.collection("events")
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const registrationsCollection = db.collection("event_registrations")

    // Check if user already registered for this event
    const existingReg = await registrationsCollection.findOne({
      eventId: new ObjectId(eventId),
      userId: new ObjectId(decoded.userId),
    })

    if (existingReg) {
      return NextResponse.json({ error: "You are already registered for this event" }, { status: 400 })
    }

    // Count registrations for this event
    const registrationCount = await registrationsCollection.countDocuments({
      eventId: new ObjectId(eventId),
    })

    if (registrationCount >= event.volunteerSlotsNeeded) {
      return NextResponse.json({ error: "No more volunteer slots available for this event" }, { status: 400 })
    }

    // Create registration
    const result = await registrationsCollection.insertOne({
      eventId: new ObjectId(eventId),
      userId: new ObjectId(decoded.userId),
      email: decoded.email || "",
      registrationNumber,
      name,
      timeSlot,
      status: "Participant", // Default role/status
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create notification for user
    try {
      const notificationsCollection = db.collection("notifications")
      await notificationsCollection.insertOne({
        userId: new ObjectId(decoded.userId),
        type: "event_registration",
        title: "Registration Confirmed",
        message: `You have been registered for ${event.title} at ${event.location} in ${timeSlot}`,
        eventId: new ObjectId(eventId),
        registrationId: result.insertedId,
        read: false,
        createdAt: new Date(),
      })
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError)
      // Don't fail the registration if notification fails
    }

    return NextResponse.json(
      {
        message: "Registration successful",
        registrationId: result.insertedId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Event registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET: Get registrations for an event (user view - limited info)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")
    const checkUserRegistration = url.searchParams.get("checkUser") === "true"

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")

    // If checking current user's registration status
    if (checkUserRegistration) {
      const token = request.headers.get("authorization")?.split(" ")[1]
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const decoded = verifyToken(token)
      if (!decoded || !decoded.userId) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      const userRegistration = await registrationsCollection.findOne({
        eventId: new ObjectId(eventId),
        userId: new ObjectId(decoded.userId),
      })

      return NextResponse.json({
        isRegistered: !!userRegistration,
        registration: userRegistration || null,
      })
    }

    // Otherwise, get all registrations for the event
    const registrations = await registrationsCollection
      .find({ eventId: new ObjectId(eventId) })
      .project({ name: 1, timeSlot: 1, status: 1, createdAt: 1 })
      .toArray()

    return NextResponse.json({
      registrations,
      total: registrations.length,
    })
  } catch (error) {
    console.error("Get registrations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}