import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

// Define the response structure
interface ScanResult {
  registration: any
  type: "donor" | "volunteer"
  event: any
}

// GET: Verify QR Token and return details (Search)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    const url = new URL(request.url)
    const qrToken = url.searchParams.get("alphanumericToken") || url.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!qrToken) {
      return NextResponse.json({ error: "QR Token is required" }, { status: 400 })
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

    const db = await getDatabase()
    const ngoId = new ObjectId(decoded.ngoId)

    // 1. Search in Event Registrations (Donors)
    const eventRegistrations = db.collection("event_registrations")
    let registration = await eventRegistrations.findOne({ 
      alphanumericToken: { $regex: new RegExp(`^${qrToken}$`, 'i') } 
    })
    let type: "donor" | "volunteer" = "donor"

    // 2. If not found, search in Volunteer Registrations
    if (!registration) {
      const volunteerRegistrations = db.collection("volunteer_registrations")
      registration = await volunteerRegistrations.findOne({ 
        alphanumericToken: { $regex: new RegExp(`^${qrToken}$`, 'i') } 
      })
      type = "volunteer"
    }

    if (!registration) {
      return NextResponse.json({ error: "Invalid QR Code or Token" }, { status: 404 })
    }

    // 3. Verify Event Ownership
    const eventsCollection = db.collection("events")
    let eventId = registration.eventId
    
    // Ensure eventId is ObjectId
    if (typeof eventId === 'string') {
        try {
            eventId = new ObjectId(eventId)
        } catch (e) {
            console.error("Invalid eventId format:", eventId)
        }
    }

    const event = await eventsCollection.findOne({ _id: eventId })

    if (!event) {
      return NextResponse.json({ error: "Associated event not found" }, { status: 404 })
    }

    // Check if the event belongs to this NGO
    // Support both ngoId field and createdBy field if needed, but primarily ngoId
    const eventNgoId = event.ngoId ? new ObjectId(event.ngoId) : null
    
    if (!eventNgoId || !eventNgoId.equals(ngoId)) {
       return NextResponse.json({ 
         error: "This participant is registered for an event not managed by you." 
       }, { status: 403 })
    }

    // 4. Return Details
    // Fetch user details to show name if not in registration
    let userDetails = null
    if (registration.userId) {
        const usersCollection = db.collection("users")
        userDetails = await usersCollection.findOne({ _id: new ObjectId(registration.userId) })
    }

    return NextResponse.json({
      registration: {
        ...registration,
        userName: registration.userName || registration.name || userDetails?.name || "Unknown User",
        userEmail: registration.userEmail || registration.email || userDetails?.email || "",
      },
      type,
      event: {
        title: event.title,
        eventDate: event.eventDate,
        location: event.location
      }
    })

  } catch (error) {
    console.error("NGO QR Search Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Mark as Verified/Attended
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

    const { registrationId, type } = await request.json()

    if (!registrationId || !type) {
        return NextResponse.json({ error: "Registration ID and Type are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const ngoId = new ObjectId(decoded.ngoId)
    
    // Determine collection
    const collectionName = type === "volunteer" ? "volunteer_registrations" : "event_registrations"
    const collection = db.collection(collectionName)

    // Find registration to verify ownership again (security)
    const registration = await collection.findOne({ _id: new ObjectId(registrationId) })
    
    if (!registration) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Verify Event Ownership
    const eventsCollection = db.collection("events")
    let eventId = registration.eventId
     if (typeof eventId === 'string') {
        try {
            eventId = new ObjectId(eventId)
        } catch (e) {
             // ignore
        }
    }
    const event = await eventsCollection.findOne({ _id: eventId })
    
    if (!event || !event.ngoId || !new ObjectId(event.ngoId).equals(ngoId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Perform Update
    const updateResult = await collection.updateOne(
        { _id: new ObjectId(registrationId) },
        {
            $set: {
                tokenVerified: true,
                verifiedAt: new Date(),
                verifiedBy: ngoId,
                verifiedByModel: "NGO",
                status: "Attended", // Common status
                donationStatus: type === 'donor' ? "Completed" : undefined // Only for donors
            }
        }
    )

    if (updateResult.modifiedCount === 0) {
         // It might be already verified, but let's check
         if (registration.tokenVerified) {
             return NextResponse.json({ message: "Already verified" })
         }
         return NextResponse.json({ error: "Failed to update registration" }, { status: 500 })
    }

    // If Donor, update user stats
    if (type === 'donor' && registration.userId) {
        const usersCollection = db.collection("users")
        await usersCollection.updateOne(
            { _id: new ObjectId(registration.userId) },
            {
                $inc: { totalDonations: 1 },
                $set: { lastDonationDate: new Date() }
            }
        )
    }
    // If Volunteer, update volunteer hours/stats (optional, can be added later)
    if (type === 'volunteer' && registration.userId) {
         // Logic to add volunteer hours could go here
    }

    return NextResponse.json({ 
        success: true, 
        message: `${type === 'donor' ? 'Donor' : 'Volunteer'} marked as verified/attended` 
    })

  } catch (error) {
    console.error("NGO QR Verify Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
