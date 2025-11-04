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

// Generate a unique QR code token
function generateQRToken(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
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

    // Get user's email from database if not in token
    const usersCollection = db.collection("users")
    const userData = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
    const userEmail = decoded.email || userData?.email || ""

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

    // Generate QR code token
    const qrToken = generateQRToken()

    // Validate QR token was generated
    if (!qrToken || qrToken.trim() === "") {
      return NextResponse.json(
        { error: "Failed to generate QR token" },
        { status: 500 }
      )
    }

    // Create registration
    const result = await registrationsCollection.insertOne({
      eventId: new ObjectId(eventId),
      userId: new ObjectId(decoded.userId),
      email: userEmail,
      registrationNumber,
      name,
      timeSlot,
      status: "Registered", // Default role/status
      qrToken, // Unique QR code identifier
      qrVerified: false, // Track if QR has been verified/scanned
      donationStatus: "Pending", // Track donation status: Pending, Completed, Cancelled
      verifiedAt: null, // When QR was verified
      verifiedBy: null, // Admin who verified
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
        qrToken,
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

    // Check if getting specific registration details
    const registrationId = url.searchParams.get("registrationId")
    if (registrationId) {
      let registration = await registrationsCollection.findOne({
        _id: new ObjectId(registrationId),
      })

      if (!registration) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 })
      }

      // CRITICAL FIX: Generate qrToken if missing (handles legacy registrations)
      if (!registration.qrToken || registration.qrToken.trim() === "") {
        const newQrToken = generateQRToken()
        await registrationsCollection.updateOne(
          { _id: new ObjectId(registrationId) },
          {
            $set: {
              qrToken: newQrToken,
              qrVerified: false,
              updatedAt: new Date(),
            }
          }
        )
        registration.qrToken = newQrToken
        registration.qrVerified = false
      }

      return NextResponse.json({
        registration,
      })
    }

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

      let userRegistration = await registrationsCollection.findOne({
        eventId: new ObjectId(eventId),
        userId: new ObjectId(decoded.userId),
      })

      // Enrich with event data
      let enrichedRegistration = null
      if (userRegistration) {
        // CRITICAL FIX: Generate qrToken if missing (handles legacy registrations)
        if (!userRegistration.qrToken || userRegistration.qrToken.trim() === "") {
          const newQrToken = generateQRToken()
          await registrationsCollection.updateOne(
            { _id: userRegistration._id },
            {
              $set: {
                qrToken: newQrToken,
                qrVerified: false,
                updatedAt: new Date(),
              }
            }
          )
          userRegistration.qrToken = newQrToken
          userRegistration.qrVerified = false
        }

        const eventsCollection = db.collection("events")
        const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })
        enrichedRegistration = {
          ...userRegistration,
          event: event
            ? {
                title: event.title,
                location: event.location,
                eventDate: event.eventDate,
              }
            : undefined,
        }
      }

      return NextResponse.json({
        isRegistered: !!userRegistration,
        registration: enrichedRegistration || null,
      })
    }

    // Otherwise, get all registrations for the event (returns all fields for admin/detailed views)
    let registrations = await registrationsCollection
      .find({ eventId: new ObjectId(eventId) })
      .toArray()

    // Get event data for enrichment
    const eventsCollection = db.collection("events")
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })

    // CRITICAL FIX: Ensure all registrations have qrToken (batch update legacy registrations)
    const registrationsNeedingQRToken = registrations.filter(
      (reg) => !reg.qrToken || reg.qrToken.trim() === ""
    )

    if (registrationsNeedingQRToken.length > 0) {
      for (const reg of registrationsNeedingQRToken) {
        const newQrToken = generateQRToken()
        await registrationsCollection.updateOne(
          { _id: reg._id },
          {
            $set: {
              qrToken: newQrToken,
              qrVerified: false,
              updatedAt: new Date(),
            }
          }
        )
        reg.qrToken = newQrToken
        reg.qrVerified = false
      }
    }

    // Enrich with event data
    const enrichedRegistrations = registrations.map((reg) => ({
      ...reg,
      event: event
        ? {
            title: event.title,
            location: event.location,
            eventDate: event.eventDate,
            description: event.description,
            bloodType: event.bloodType,
          }
        : undefined,
    }))

    return NextResponse.json({
      registrations: enrichedRegistrations,
      total: enrichedRegistrations.length,
    })
  } catch (error) {
    console.error("Get registrations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}