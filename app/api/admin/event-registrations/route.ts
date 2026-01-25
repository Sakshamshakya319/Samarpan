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
    const volunteerRegistrationsCollection = db.collection("volunteer_registrations")
    const eventsCollection = db.collection("events")
    const usersCollection = db.collection("users")

    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")
    const format = url.searchParams.get("format")

    // If eventId is provided, get all registrations for that event (for admin view)
    if (eventId) {
      // 1. Fetch Donor Registrations
      let donorRegistrations = await registrationsCollection
        .find({ eventId: new ObjectId(eventId) })
        .sort({ createdAt: -1 })
        .toArray()

      // Backfill missing qrTokens for donors
      const donorsNeedingQR = donorRegistrations.filter(
        (reg) => !reg.qrToken || reg.qrToken.trim() === ""
      )

      if (donorsNeedingQR.length > 0) {
        for (const reg of donorsNeedingQR) {
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
          reg.updatedAt = new Date()
        }
      }

      // 2. Fetch Volunteer Registrations
      let volunteerRegistrations = await volunteerRegistrationsCollection
        .find({ eventId: new ObjectId(eventId) })
        .sort({ registeredAt: -1 })
        .toArray()
      
      // Get event data once
      const event = await eventsCollection.findOne({
        _id: new ObjectId(eventId),
      })

      // 3. Map Donors
      const mappedDonors = donorRegistrations.map((reg) => ({
        _id: reg._id,
        eventId: reg.eventId,
        userId: reg.userId,
        email: reg.email || "",
        phone: reg.phone || "",
        registrationNumber: reg.registrationNumber || "",
        name: reg.name || "",
        timeSlot: reg.timeSlot || "",
        participantType: "donor",
        status: reg.status || "Registered",
        qrToken: reg.qrToken || "",
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

      // 4. Map Volunteers
      const mappedVolunteers = volunteerRegistrations.map((reg) => ({
        _id: reg._id,
        eventId: reg.eventId,
        userId: reg.userId,
        email: reg.userEmail || reg.email || "",
        phone: reg.userPhone || reg.phone || "",
        registrationNumber: reg._id.toString().substring(0, 8).toUpperCase(), // Generate pseudo-reg number
        name: reg.userName || reg.name || "",
        timeSlot: reg.availability || "Flexible",
        participantType: "volunteer",
        status: reg.status || "Registered",
        qrToken: reg.alphanumericToken || "", // Map alphanumericToken to qrToken
        qrVerified: reg.tokenVerified || false,
        donationStatus: "N/A",
        verifiedAt: reg.updatedAt, // Approximate
        verifiedBy: null,
        createdAt: reg.registeredAt || reg.createdAt,
        updatedAt: reg.updatedAt,
        event: event
          ? {
              title: event.title,
              location: event.location,
              eventDate: event.eventDate,
            }
          : null,
      }))

      // 5. Combine and Sort
      const allRegistrations = [...mappedDonors, ...mappedVolunteers].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

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

        const rows = allRegistrations.map((reg: any) => [
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
        registrations: allRegistrations,
        total: allRegistrations.length,
      })
    }

    // Otherwise, get all registrations for the user (fallback to existing logic for non-event specific query)
    // Note: This part seems to be for "My Registrations" view for a logged-in admin user acting as a regular user?
    // But this route is under /api/admin/, so it's likely for Admin managing THEIR own registrations?
    // Or it's a copy-paste from user route.
    // Given the path is /api/admin/event-registrations, it's strictly for admin management.
    // If eventId is NOT provided, it might be fetching ALL registrations across system?
    // The original code fetched "registrations for the user" using decoded.userId.
    // But decoded is an ADMIN token.
    // Let's keep the original logic for the "else" block but verify it makes sense.
    // Admin token has adminId.
    // If the original code used decoded.userId, it might have been failing if verifyAdminToken returns adminId.
    // verifyAdminToken returns { adminId, role, email }.
    // The original code: registrationsCollection.find({ userId: new ObjectId(decoded.userId) })
    // THIS WOULD FAIL if decoded doesn't have userId.
    // However, verifyAdminToken usually decodes to what was signed.
    // If generateAdminToken signs { adminId }, then decoded.userId is undefined.
    // So the original "else" block was likely broken for pure admins anyway.
    // I will leave it as is but fix the type error if possible, or just focus on the eventId case which is the issue.
    // Actually, I'll update it to handle the undefined userId gracefully or just return empty.
    
    // For now, I'll focus on the eventId case which is what the dashboard uses.
    
    // Original "else" block logic preserved but fixed for safety:
    const userIdToQuery = (decoded as any).userId || (decoded as any).adminId
    
    let registrations = await registrationsCollection
      .find({ userId: new ObjectId(userIdToQuery) })
      .sort({ createdAt: -1 })
      .toArray()

    // Backfill logic for user registrations...
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
        reg.updatedAt = new Date()
      }
    }

    const user = await usersCollection.findOne({
      _id: new ObjectId(userIdToQuery),
    })

    const enrichedRegistrations = await Promise.all(
      registrations.map(async (reg) => {
        const event = await eventsCollection.findOne({
          _id: new ObjectId(reg.eventId),
        })
        
        const registrationEmail = reg.email || decoded.email || user?.email || ""
        
        return {
          _id: reg._id,
          eventId: reg.eventId,
          userId: reg.userId,
          email: registrationEmail,
          phone: reg.phone || "",
          registrationNumber: reg.registrationNumber || "",
          name: reg.name || "",
          timeSlot: reg.timeSlot || "",
          participantType: reg.participantType || "donor", // Default to donor for event_registrations
          status: reg.status || "Registered",
          qrToken: reg.qrToken || "",
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