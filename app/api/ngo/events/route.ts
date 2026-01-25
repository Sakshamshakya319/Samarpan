import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Decode NGO token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!decoded.ngoId || decoded.role !== "ngo") {
      return NextResponse.json({ error: "Invalid NGO token" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const ngosCollection = db.collection("ngos")
    const eventsCollection = db.collection("events")

    // Check if NGO exists and is approved
    const ngo = await ngosCollection.findOne({ _id: new ObjectId(decoded.ngoId) })
    
    if (!ngo || ngo.status !== "approved" || ngo.isPaused) {
      return NextResponse.json({ error: "NGO not authorized to create events" }, { status: 403 })
    }

    const {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      expectedAttendees,
      volunteerSlotsNeeded,
      eventTypes, // Changed from eventType to eventTypes (array)
      locationType,
      participantCategories
    } = await request.json()

    // Validation
    if (!title || !description || !eventDate || !location || !locationType || !participantCategories?.length || !eventTypes?.length) {
      return NextResponse.json({
        error: "Title, description, date, location, location type, participant categories, and event types are required"
      }, { status: 400 })
    }

    // Validate participant categories based on location type
    const validCategories = {
      school: ["students", "staff", "others"],
      college: ["students", "faculty", "staff", "others"],
      society: ["children", "men", "women", "elderly_men", "elderly_women", "others"],
      hospital: ["patients", "staff", "visitors", "others"],
      corporate: ["employees", "management", "visitors", "others"],
      public: ["general_public", "others"]
    }

    if (!validCategories[locationType as keyof typeof validCategories]) {
      return NextResponse.json({ error: "Invalid location type" }, { status: 400 })
    }

    const allowedCategories = validCategories[locationType as keyof typeof validCategories]
    const invalidCategories = participantCategories.filter((cat: string) => !allowedCategories.includes(cat))
    
    if (invalidCategories.length > 0) {
      return NextResponse.json({
        error: `Invalid participant categories for ${locationType}: ${invalidCategories.join(", ")}`
      }, { status: 400 })
    }

    // Create event with pending approval status
    const result = await eventsCollection.insertOne({
      title,
      description,
      eventDate: new Date(eventDate),
      startTime: startTime || "",
      endTime: endTime || "",
      location,
      expectedAttendees: expectedAttendees || 0,
      volunteerSlotsNeeded: volunteerSlotsNeeded || 0,
      eventTypes: eventTypes || ["donation_camp"], // Changed to array
      locationType,
      participantCategories,
      status: "pending_approval", // Requires super admin approval
      allowRegistrations: false, // Will be enabled after approval
      ngoId: new ObjectId(decoded.ngoId),
      ngoName: ngo.ngoName,
      ngoEmail: ngo.ngoEmail,
      ngoPhone: ngo.ngoPhone,
      createdBy: new ObjectId(decoded.ngoId),
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null
    })

    // Send notification email to super admin
    try {
      await sendEmail({
        to: "admin@samarpan.com", // Super admin email
        subject: `New Event Approval Required - ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">New Event Requires Approval</h2>
            <p>A new event has been submitted by <strong>${ngo.ngoName}</strong> and requires your approval.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #374151;">Event Details:</h3>
              <p><strong>Title:</strong> ${title}</p>
              <p><strong>NGO:</strong> ${ngo.ngoName}</p>
              <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Location Type:</strong> ${locationType}</p>
              <p><strong>Expected Attendees:</strong> ${expectedAttendees}</p>
              <p><strong>Volunteer Slots:</strong> ${volunteerSlotsNeeded}</p>
              <p><strong>Participant Categories:</strong> ${participantCategories.join(", ")}</p>
            </div>
            
            <p>Please log in to the admin panel to review and approve this event.</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/super-admin" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Event
            </a>
          </div>
        `
      })
    } catch (emailError) {
      console.error("Failed to send approval notification email:", emailError)
    }

    return NextResponse.json({
      message: "Event submitted successfully and is pending approval",
      eventId: result.insertedId,
      status: "pending_approval"
    }, { status: 201 })

  } catch (error) {
    console.error("NGO create event error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Decode NGO token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const isAdmin = decoded.role === 'admin' || decoded.role === 'superadmin'

    if (!isAdmin && (!decoded.ngoId || decoded.role !== "ngo")) {
      return NextResponse.json({ error: "Invalid NGO token" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")
    const registrationsCollection = db.collection("event_registrations")

    // Get events created by this NGO (or all if admin)
    let query: any = {}
    if (!isAdmin) {
        query.ngoId = new ObjectId(decoded.ngoId)
    }

    const events = await eventsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        // Count donor registrations (if applicable, though typically volunteers are main metric for NGO events)
        const donorCount = await registrationsCollection.countDocuments({
          eventId: event._id
        })
        
        // Count volunteer registrations
        const volunteerCount = await db.collection("volunteer_registrations").countDocuments({
           eventId: event._id
        })

        // For NGO events, we typically care about volunteer slots
        // If the event allows donors, we might want to separate them or sum them
        // Given the UI uses "registeredVolunteers", we should definitely include volunteers
        // If previous logic was only counting donors (event_registrations), that was the bug.
        
        // Let's assume registeredVolunteers should be the count of volunteers
        // If donors also consume slots, we might add them. But usually "volunteerSlotsNeeded" implies volunteers.
        // We will sum them just in case, or stick to volunteerCount if event_registrations are purely donors.
        
        // Based on analysis: 
        // event_registrations = Donors
        // volunteer_registrations = Volunteers
        
        // The field is "registeredVolunteers". So it should strictly be volunteerCount.
        // However, if the user was confused why it was 0, it's because it was counting donors but checking for volunteers.
        
        return {
          ...event,
          registeredVolunteers: volunteerCount, // Corrected to count volunteers
          registeredDonors: donorCount, // Added for clarity if needed by frontend
          // Ensure eventTypes is always an array for consistency
          eventTypes: Array.isArray(event.eventTypes) ? event.eventTypes : [event.eventType || "donation_camp"]
        }
      })
    )

    return NextResponse.json({
      events: eventsWithCounts,
      total: eventsWithCounts.length
    })

  } catch (error) {
    console.error("NGO get events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}