import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * User Event Registrations API
 * Get current user's event registrations
 */

// Generate a unique 6-digit alphanumeric token
function generateAlphanumericToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

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

    // Get user's registrations
    const registrations = await registrationsCollection
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    // Backfill alphanumericToken if missing
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

    // Get event data for each registration
    const eventsCollection = db.collection("events")
    const enrichedRegistrations = await Promise.all(
      registrations.map(async (registration) => {
        // Ensure eventId is treated as ObjectId
        let eventId = registration.eventId
        if (typeof eventId === 'string') {
            try {
                eventId = new ObjectId(eventId)
            } catch (e) {
                console.error("Invalid eventId format:", eventId)
            }
        }

        const event = await eventsCollection.findOne({ _id: eventId })

        return {
          ...registration,
          event: event
            ? {
                title: event.title,
                location: event.location,
                eventDate: event.eventDate,
              }
            : undefined,
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