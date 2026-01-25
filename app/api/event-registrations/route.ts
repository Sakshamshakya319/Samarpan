import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sendWhatsAppNotification } from "@/lib/whatsapp"

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
  // Updated: participant type can be any string based on event's participant categories
  participantType?: string
}

// Generate a unique 6-digit alphanumeric token
function generateAlphanumericToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
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
    const { eventId, registrationNumber, name, timeSlot, participantType } = (await request.json()) as RegistrationData

    // Validation
    if (!eventId || !name || !timeSlot) {
      return NextResponse.json(
        { error: "Event ID, name, and time slot are required" },
        { status: 400 }
      )
    }

    // Validate participant type against event's allowed categories
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if participant type is valid for this event
    const participant = (participantType || "others").toLowerCase()
    if (event.participantCategories && !event.participantCategories.includes(participant)) {
      return NextResponse.json(
        { error: "Invalid participant type for this event" },
        { status: 400 }
      )
    }

    // Check if identifier is required based on event location type and participant type
    const requiresIdentifier = (
      (event.locationType === 'school' && (participant === 'students' || participant === 'staff')) ||
      (event.locationType === 'college' && (participant === 'students' || participant === 'faculty' || participant === 'staff')) ||
      (event.locationType === 'corporate' && (participant === 'employees' || participant === 'management')) ||
      (event.locationType === 'hospital' && participant === 'staff')
    )

    if (requiresIdentifier && (!registrationNumber || !registrationNumber.trim())) {
      return NextResponse.json(
        { error: "Identifier is required for this participant type" },
        { status: 400 }
      )
    }

    // Get user's email and phone from database
    const usersCollection = db.collection("users")
    const userData = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
    const userEmail = decoded.email || userData?.email || ""
    const userPhone = userData?.phone || ""

    // Check if event exists and has available slots
    const registrationsCollection = db.collection("event_registrations")

    // Check if user already registered for this event
    const existingReg = await registrationsCollection.findOne({
      eventId: new ObjectId(eventId),
      userId: new ObjectId(decoded.userId),
    })

    if (existingReg) {
      return NextResponse.json({ error: "You are already registered for this event" }, { status: 400 })
    }

    // Check if user is already registered as volunteer
    const volunteerRegistrationsCollection = db.collection("volunteer_registrations")
    const existingVolunteerReg = await volunteerRegistrationsCollection.findOne({
      eventId: new ObjectId(eventId),
      userId: new ObjectId(decoded.userId),
    })

    if (existingVolunteerReg) {
      return NextResponse.json({ 
        error: "You are already registered as a volunteer for this event" 
      }, { status: 400 })
    }

    // Count registrations for this event
    const registrationCount = await registrationsCollection.countDocuments({
      eventId: new ObjectId(eventId),
    })

    if (registrationCount >= event.volunteerSlotsNeeded) {
      return NextResponse.json({ error: "No more volunteer slots available for this event" }, { status: 400 })
    }

    // Generate alphanumeric token
    const alphanumericToken = generateAlphanumericToken()

    // Validate token was generated
    if (!alphanumericToken || alphanumericToken.trim() === "") {
      return NextResponse.json(
        { error: "Failed to generate registration token" },
        { status: 500 }
      )
    }

    // Create registration
    const result = await registrationsCollection.insertOne({
      eventId: new ObjectId(eventId),
      userId: new ObjectId(decoded.userId),
      email: userEmail,
      phone: userPhone, // Add phone number to registration
      registrationNumber,
      name,
      timeSlot,
      participantType: participant,
      status: "Registered", // Default role/status
      alphanumericToken, // Unique 6-digit alphanumeric identifier
      tokenVerified: false, // Track if token has been verified
      donationStatus: "Pending", // Track donation status: Pending, Completed, Cancelled
      verifiedAt: null, // When token was verified
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

      // Send WhatsApp to user (best-effort)
      try {
        const usersCollection = db.collection("users")
        const userDoc = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
        if (userDoc?.phone) {
          await sendWhatsAppNotification({
            phone: userDoc.phone,
            title: "Registration Confirmed",
            message: `You have been registered for ${event.title} at ${event.location} in ${timeSlot}`,
          })
        }
      } catch (waErr) {
        console.error("[Event Registration] WhatsApp send error:", waErr)
      }
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError)
      // Don't fail the registration if notification fails
    }

    return NextResponse.json(
      {
        message: "Registration successful",
        registrationId: result.insertedId,
        alphanumericToken,
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
    const registrationId = url.searchParams.get("registrationId")
    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")

    // Allow fetching a specific registration by ID without requiring eventId
    if (registrationId) {
      let registration = await registrationsCollection.findOne({
        _id: new ObjectId(registrationId),
      })

      if (!registration) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 })
      }

      // CRITICAL FIX: Generate alphanumericToken if missing (handles legacy registrations)
      if (!registration.alphanumericToken || registration.alphanumericToken.trim() === "") {
        const newToken = generateAlphanumericToken()
        await registrationsCollection.updateOne(
          { _id: new ObjectId(registrationId) },
          {
            $set: {
              alphanumericToken: newToken,
              tokenVerified: false,
              updatedAt: new Date(),
            }
          }
        )
        registration.alphanumericToken = newToken
        registration.tokenVerified = false
      }

      return NextResponse.json({
        registration,
      })
    }

    // For other queries (list by event or check user), eventId is required
    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
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
        // CRITICAL FIX: Generate alphanumericToken if missing (handles legacy registrations)
        if (!userRegistration.alphanumericToken || userRegistration.alphanumericToken.trim() === "") {
          const newToken = generateAlphanumericToken()
          await registrationsCollection.updateOne(
            { _id: userRegistration._id },
            {
              $set: {
                alphanumericToken: newToken,
                tokenVerified: false,
                updatedAt: new Date(),
              }
            }
          )
          userRegistration.alphanumericToken = newToken
          userRegistration.tokenVerified = false
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
        type: 'donor'
      })
    }

    // Otherwise, get all registrations for the event (returns all fields for admin/detailed views)
    let registrations = await registrationsCollection
      .find({ eventId: new ObjectId(eventId) })
      .toArray()

    // Get event data for enrichment
    const eventsCollection = db.collection("events")
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })

    // CRITICAL FIX: Ensure all registrations have alphanumericToken (batch update legacy registrations)
    const registrationsNeedingToken = registrations.filter(
      (reg) => !reg.alphanumericToken || reg.alphanumericToken.trim() === ""
    )

    if (registrationsNeedingToken.length > 0) {
      for (const reg of registrationsNeedingToken) {
        const newToken = generateAlphanumericToken()
        await registrationsCollection.updateOne(
          { _id: reg._id },
          {
            $set: {
              alphanumericToken: newToken,
              tokenVerified: false,
              updatedAt: new Date(),
            }
          }
        )
        reg.alphanumericToken = newToken
        reg.tokenVerified = false
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