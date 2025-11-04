import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * User Event Registrations API
 * Get user's event registrations
 */

// Generate a unique QR code token
function generateQRToken(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

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

    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")

    // If eventId is provided, get all registrations for that event (for admin view)
    if (eventId) {
      let eventRegistrations = await registrationsCollection
        .find({ eventId: new ObjectId(eventId) })
        .sort({ createdAt: -1 })
        .toArray()

      // CRITICAL FIX: Generate missing qrTokens for legacy registrations
      const registrationsNeedingQRToken = eventRegistrations.filter(
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
          // Update in-memory registration object
          reg.qrToken = newQrToken
          reg.qrVerified = false
          reg.updatedAt = new Date()
        }
      }

      // Get the event data for enrichment
      const event = await eventsCollection.findOne({
        _id: new ObjectId(eventId),
      })

      // Enrich registrations with event data and ensure all required fields
      const enrichedEventRegistrations = eventRegistrations.map((reg) => ({
        _id: reg._id,
        eventId: reg.eventId,
        userId: reg.userId,
        email: reg.email || "", // Email from registration record
        registrationNumber: reg.registrationNumber || "",
        name: reg.name || "",
        timeSlot: reg.timeSlot || "",
        status: reg.status || "Registered",
        qrToken: reg.qrToken || "", // ALWAYS present now after generation
        qrVerified: reg.qrVerified || false,
        donationStatus: reg.donationStatus || "Pending",
        verifiedAt: reg.verifiedAt || null,
        verifiedBy: reg.verifiedBy || null,
        createdAt: reg.createdAt,
        updatedAt: reg.updatedAt,
        event: event
          ? {
              title: event.title,
              location: event.location,
              eventDate: event.eventDate,
            }
          : null,
      }))

      return NextResponse.json({
        registrations: enrichedEventRegistrations,
        total: enrichedEventRegistrations.length,
      })
    }

    // Otherwise, get all registrations for the user
    let registrations = await registrationsCollection
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    // CRITICAL FIX: Generate missing qrTokens for legacy registrations
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
        // Update in-memory registration object
        reg.qrToken = newQrToken
        reg.qrVerified = false
        reg.updatedAt = new Date()
      }
    }

    // Get user details for email fallback
    const usersCollection = db.collection("users")
    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    })

    // Enrich with event data and ensure all required fields exist
    const enrichedRegistrations = await Promise.all(
      registrations.map(async (reg) => {
        const event = await eventsCollection.findOne({
          _id: new ObjectId(reg.eventId),
        })
        
        // Use email from registration, JWT token, or user record (in that priority order)
        const registrationEmail = reg.email || decoded.email || user?.email || ""
        
        // Ensure all required fields exist with proper defaults
        return {
          _id: reg._id,
          eventId: reg.eventId,
          userId: reg.userId,
          email: registrationEmail,
          registrationNumber: reg.registrationNumber || "",
          name: reg.name || "",
          timeSlot: reg.timeSlot || "",
          status: reg.status || "Registered",
          qrToken: reg.qrToken || "", // ALWAYS present now after generation
          qrVerified: reg.qrVerified || false,
          donationStatus: reg.donationStatus || "Pending",
          verifiedAt: reg.verifiedAt || null,
          verifiedBy: reg.verifiedBy || null,
          createdAt: reg.createdAt,
          updatedAt: reg.updatedAt,
          event: event
            ? {
                title: event.title,
                location: event.location,
                eventDate: event.eventDate,
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