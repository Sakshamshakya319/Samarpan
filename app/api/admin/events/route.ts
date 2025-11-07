import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { logAdminAction } from "@/lib/admin-actions"

/**
 * Admin Events Management
 * Create, update, delete events
 */

export async function POST(request: NextRequest) {
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
    const { title, description, eventDate, startTime, endTime, location, expectedAttendees, eventType, volunteerSlotsNeeded, allowRegistrations, ngoName, ngoLogo, ngoWebsite, organizedBy } =
      await request.json()

    // Validation
    if (!title || !description || !eventDate || !location) {
      return NextResponse.json(
        { error: "Title, description, date, and location are required" },
        { status: 400 }
      )
    }

    const eventsCollection = db.collection("events")

    const result = await eventsCollection.insertOne({
      title,
      description,
      eventDate: new Date(eventDate),
      startTime: startTime || "",
      endTime: endTime || "",
      location,
      expectedAttendees: expectedAttendees || 0,
      volunteerSlotsNeeded: volunteerSlotsNeeded || 0,
      eventType: eventType || "donation_camp", // donation_camp, awareness_seminar, donor_appreciation, etc.
      status: "active", // active, completed, cancelled
      allowRegistrations: allowRegistrations === true, // Default to false if not specified
      ngoName: ngoName || "", // NGO name (optional)
      ngoLogo: ngoLogo || "", // NGO logo URL (optional)
      ngoWebsite: ngoWebsite || "", // NGO website (optional)
      organizedBy: organizedBy || "", // Organized by description (optional)
      createdBy: new ObjectId(decoded.adminId),
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: "", // Can be added later
    })

    await logAdminAction(decoded.adminId, "create_event", { eventId: result.insertedId, title });

    return NextResponse.json(
      {
        message: "Event created successfully",
        eventId: result.insertedId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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
    const eventsCollection = db.collection("events")
    const url = new URL(request.url)
    const status = url.searchParams.get("status")

    let query = {}
    if (status) {
      query = { status }
    }

    const events = await eventsCollection
      .find(query)
      .sort({ eventDate: -1 })
      .toArray()

    return NextResponse.json({ events, total: events.length })
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const { eventId, title, description, eventDate, startTime, endTime, location, expectedAttendees, status, volunteerSlotsNeeded, allowRegistrations, ngoName, ngoLogo, ngoWebsite, organizedBy } =
      await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const eventsCollection = db.collection("events")

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (title) updateData.title = title
    if (description) updateData.description = description
    if (eventDate) updateData.eventDate = new Date(eventDate)
    if (startTime) updateData.startTime = startTime
    if (endTime) updateData.endTime = endTime
    if (location) updateData.location = location
    if (expectedAttendees !== undefined) updateData.expectedAttendees = expectedAttendees
    if (volunteerSlotsNeeded !== undefined) updateData.volunteerSlotsNeeded = volunteerSlotsNeeded
    if (status) updateData.status = status
    if (allowRegistrations !== undefined) {
      updateData.allowRegistrations = allowRegistrations === true;
    }
    if (ngoName !== undefined) updateData.ngoName = ngoName
    if (ngoLogo !== undefined) updateData.ngoLogo = ngoLogo
    if (ngoWebsite !== undefined) updateData.ngoWebsite = ngoWebsite
    if (organizedBy !== undefined) updateData.organizedBy = organizedBy

    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await logAdminAction(decoded.adminId, "update_event", { eventId, ...updateData });

    return NextResponse.json({ message: "Event updated successfully" });
  } catch (error) {
    console.error("Update event error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const eventsCollection = db.collection("events")

    const result = await eventsCollection.deleteOne({ _id: new ObjectId(eventId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await logAdminAction(decoded.adminId, "delete_event", { eventId });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}