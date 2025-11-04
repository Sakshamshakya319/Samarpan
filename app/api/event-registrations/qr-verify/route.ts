import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * QR Code Verification API
 * Admin verifies QR codes and marks donors as completed
 */

// POST: Verify QR code and mark donation as completed
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
    const { qrToken, registrationId } = (await request.json()) as {
      qrToken?: string
      registrationId?: string
    }

    if (!qrToken && !registrationId) {
      return NextResponse.json(
        { error: "QR token or registration ID is required" },
        { status: 400 }
      )
    }

    const registrationsCollection = db.collection("event_registrations")
    const usersCollection = db.collection("users")

    // Find registration
    let registration
    if (qrToken) {
      registration = await registrationsCollection.findOne({ qrToken })
    } else if (registrationId) {
      registration = await registrationsCollection.findOne({
        _id: new ObjectId(registrationId),
      })
    }

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (registration.qrVerified) {
      return NextResponse.json(
        { error: "This registration has already been verified" },
        { status: 400 }
      )
    }

    // Update registration as verified
    const updateResult = await registrationsCollection.updateOne(
      { _id: registration._id },
      {
        $set: {
          qrVerified: true,
          donationStatus: "Completed",
          verifiedAt: new Date(),
          verifiedBy: decoded.userId,
          updatedAt: new Date(),
        },
      }
    )

    // Update user's donation record
    try {
      const user = await usersCollection.findOne({
        _id: new ObjectId(registration.userId),
      })

      if (user) {
        // Increment total donations and update last donation date
        await usersCollection.updateOne(
          { _id: new ObjectId(registration.userId) },
          {
            $set: {
              lastDonationDate: new Date(),
              updatedAt: new Date(),
            },
            $inc: {
              totalDonations: 1,
            },
          }
        )
      }
    } catch (userUpdateError) {
      console.error("Error updating user donation record:", userUpdateError)
      // Don't fail if user update fails
    }

    // Create notification for user
    try {
      const notificationsCollection = db.collection("notifications")
      const event = await db.collection("events").findOne({
        _id: new ObjectId(registration.eventId),
      })

      await notificationsCollection.insertOne({
        userId: new ObjectId(registration.userId),
        type: "event_donation_completed",
        title: "Event Participation Verified",
        message: `Your blood donation at ${event?.title} has been verified and recorded.`,
        eventId: registration.eventId,
        registrationId: registration._id,
        read: false,
        createdAt: new Date(),
      })
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError)
    }

    return NextResponse.json(
      {
        message: "QR code verified successfully",
        registration: {
          _id: registration._id,
          name: registration.name,
          registrationNumber: registration.registrationNumber,
          status: "Completed",
          verifiedAt: new Date(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("QR verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET: Get registration by QR token (for verification)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const qrToken = url.searchParams.get("qrToken")

    if (!qrToken) {
      return NextResponse.json({ error: "QR token is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")

    const registration = await registrationsCollection.findOne({ qrToken })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    const event = await db.collection("events").findOne({
      _id: new ObjectId(registration.eventId),
    })

    return NextResponse.json({
      registration: {
        _id: registration._id,
        name: registration.name,
        registrationNumber: registration.registrationNumber,
        email: registration.email,
        timeSlot: registration.timeSlot,
        qrVerified: registration.qrVerified,
        donationStatus: registration.donationStatus,
        createdAt: registration.createdAt,
        event: event ? { title: event.title, location: event.location, date: event.eventDate } : null,
      },
    })
  } catch (error) {
    console.error("Get registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}