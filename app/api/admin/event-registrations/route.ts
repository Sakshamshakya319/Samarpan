import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
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

    const decoded = verifyAdminToken(token)
    if (!decoded || !["admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const db = await getDatabase()
    const registrationsCollection = db.collection("event_registrations")
    const eventsCollection = db.collection("events")

    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")
    const format = url.searchParams.get("format")

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
        phone: reg.phone || "",
        registrationNumber: reg.registrationNumber || "",
        name: reg.name || "",
        timeSlot: reg.timeSlot || "",
        participantType: reg.participantType || "other",
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

      // If CSV export requested, return as text/csv
      if (format === "excel") {
        const headers = [
          "Registration #",
          "Name",
          "Email",
          "Phone",
          "Participant Type",
          "Time Slot",
          "Donation Status",
          "Verified",
          "Verified Date",
          "Registration Date",
        ]

        const rows = enrichedEventRegistrations.map((reg: any) => [
          reg.registrationNumber || "",
          reg.name || "",
          reg.email || "",
          reg.phone || "",
          reg.participantType || "other",
          reg.timeSlot || "",
          reg.donationStatus || "Pending",
          reg.qrVerified ? "Yes" : "No",
          reg.verifiedAt ? new Date(reg.verifiedAt).toLocaleString() : "-",
          reg.createdAt ? new Date(reg.createdAt).toLocaleString() : "-",
        ])

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
        ].join("\n")

        return new Response(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=registrations-${eventId}.csv`,
          },
        })
      }

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
          phone: reg.phone || "",
          registrationNumber: reg.registrationNumber || "",
          name: reg.name || "",
          timeSlot: reg.timeSlot || "",
          participantType: reg.participantType || "other",
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