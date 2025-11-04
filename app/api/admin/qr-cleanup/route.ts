import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * QR Code Cleanup API
 * Delete/expire QR codes after event ends
 */

// POST: Clean up expired QR codes after event ends
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const db = await getDatabase()
    const { eventId } = (await request.json()) as { eventId: string }

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Get event details
    const eventsCollection = db.collection("events")
    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const eventEndDate = new Date(event.eventDate)
    const now = new Date()

    // Check if event has ended
    if (now <= eventEndDate) {
      return NextResponse.json(
        { error: "Event has not ended yet" },
        { status: 400 }
      )
    }

    const registrationsCollection = db.collection("event_registrations")

    // Delete unverified QR codes for this event
    const result = await registrationsCollection.deleteMany({
      eventId: new ObjectId(eventId),
      qrVerified: false,
    })

    // Mark the remaining registrations as expired
    await registrationsCollection.updateMany(
      {
        eventId: new ObjectId(eventId),
        qrVerified: false,
      },
      {
        $set: {
          donationStatus: "Expired",
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json(
      {
        message: "QR codes cleaned up successfully",
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("QR cleanup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET: Get expired QR codes for an event
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")

    // Get all expired/unverified registrations for the event
    const expiredQRs = await registrationsCollection
      .find({
        eventId: new ObjectId(eventId),
        qrVerified: false,
      })
      .toArray()

    return NextResponse.json(
      {
        expiredQRs: expiredQRs || [],
        count: expiredQRs.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get expired QR codes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}