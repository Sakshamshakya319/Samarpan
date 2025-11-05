import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

/**
 * Admin Update Donor Blood Type API
 * Allows admins to update blood test results for event donors
 * and sync the results back to user profiles
 */

// Blood type validation
const VALID_BLOOD_TYPES = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
]

function validateBloodType(bloodType: string): boolean {
  return VALID_BLOOD_TYPES.includes(bloodType.toUpperCase())
}

// POST: Update blood type for a specific donor registration
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)

  try {
    // Authentication
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      console.warn(`[UPDATE-BLOOD-TYPE] Missing authentication token - Request ID: ${requestId}`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || (decoded.role !== "admin" && decoded.role !== "superadmin")) {
      console.warn(`[UPDATE-BLOOD-TYPE] Invalid admin token - Request ID: ${requestId}`)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Request body validation
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error(`[UPDATE-BLOOD-TYPE] Invalid JSON body - Request ID: ${requestId}`)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { registrationId, bloodType } = body as {
      registrationId?: string
      bloodType?: string
    }

    // Input validation
    if (!registrationId || !bloodType) {
      return NextResponse.json(
        { error: "Registration ID and blood type are required" },
        { status: 400 }
      )
    }

    if (!validateBloodType(bloodType)) {
      return NextResponse.json(
        { error: "Invalid blood type. Must be one of: " + VALID_BLOOD_TYPES.join(", ") },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")
    const usersCollection = db.collection("users")

    console.log(`[UPDATE-BLOOD-TYPE] Admin ${decoded.email} updating blood type - Request ID: ${requestId}`)

    // Find the registration
    const registration = await registrationsCollection.findOne({
      _id: new ObjectId(registrationId)
    })

    if (!registration) {
      console.warn(`[UPDATE-BLOOD-TYPE] Registration not found - Request ID: ${requestId}`)
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Update registration with blood type test result
    const updateResult = await registrationsCollection.updateOne(
      { _id: new ObjectId(registrationId) },
      {
        $set: {
          bloodType: bloodType.toUpperCase(),
          bloodTestCompleted: true,
          bloodTestUpdatedAt: new Date(),
          bloodTestUpdatedBy: decoded.adminId,
          updatedAt: new Date(),
        },
      }
    )

    if (updateResult.modifiedCount === 0) {
      console.error(`[UPDATE-BLOOD-TYPE] Failed to update registration - Request ID: ${requestId}`)
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 })
    }

    // Sync blood type to user profile if user exists
    if (registration.userId) {
      try {
        const userUpdateResult = await usersCollection.updateOne(
          { _id: new ObjectId(registration.userId) },
          {
            $set: {
              bloodGroup: bloodType.toUpperCase(),
              bloodGroupVerified: true,
              bloodGroupVerifiedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        )

        if (userUpdateResult.modifiedCount > 0) {
          console.log(`[UPDATE-BLOOD-TYPE] User blood type synced - Request ID: ${requestId}`)
        }
      } catch (userUpdateError) {
        console.error(`[UPDATE-BLOOD-TYPE] Error syncing to user profile - Request ID: ${requestId}:`, userUpdateError)
        // Don't fail the main operation if user sync fails
      }
    }

    // Create notification for user (fire and forget)
    try {
      const notificationsCollection = db.collection("notifications")
      const event = await db.collection("events").findOne({
        _id: new ObjectId(registration.eventId),
      })

      await notificationsCollection.insertOne({
        userId: new ObjectId(registration.userId),
        type: "blood_test_completed",
        title: "Blood Test Results Available",
        message: `Your blood type has been determined as ${bloodType.toUpperCase()} from the test at ${event?.title || 'the event'}.`,
        eventId: registration.eventId,
        registrationId: registration._id,
        read: false,
        createdAt: new Date(),
      })
      console.log(`[UPDATE-BLOOD-TYPE] Notification created - Request ID: ${requestId}`)
    } catch (notificationError) {
      console.error(`[UPDATE-BLOOD-TYPE] Error creating notification - Request ID: ${requestId}:`, notificationError)
    }

    const responseTime = Date.now() - startTime
    console.log(`[UPDATE-BLOOD-TYPE] Blood type updated successfully - Request ID: ${requestId} - Response time: ${responseTime}ms`)

    return NextResponse.json(
      {
        success: true,
        message: "Blood type updated successfully",
        bloodType: bloodType.toUpperCase(),
        syncedToUser: !!registration.userId,
        metadata: {
          requestId,
          updatedBy: decoded.email,
          responseTime: `${responseTime}ms`
        }
      },
      { status: 200 }
    )
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`[UPDATE-BLOOD-TYPE] Update failed - Request ID: ${requestId} - Response time: ${responseTime}ms:`, error)

    const errorMessage = process.env.NODE_ENV === 'production'
      ? "An error occurred during update. Please try again."
      : (error instanceof Error ? error.message : "Internal server error")

    return NextResponse.json({
      success: false,
      error: errorMessage,
      metadata: {
        requestId,
        responseTime: `${responseTime}ms`
      }
    }, { status: 500 })
  }
}