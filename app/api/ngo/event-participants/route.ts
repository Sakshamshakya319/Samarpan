import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token) as any
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")
    const type = url.searchParams.get("type") // 'volunteer' | 'donor' | 'all'

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")
    
    // Verify event ownership
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the event belongs to this NGO or if user is Admin
    const eventNgoId = event.ngoId ? new ObjectId(event.ngoId) : null
    
    // Allow access if user is admin or if they own the event
    const isAdmin = decoded.role === 'admin' || decoded.role === 'superadmin'
    
    if (!isAdmin) {
        // Strict ownership check for non-admins
        const ngoId = decoded.ngoId || decoded.userId
        if (!ngoId) {
             return NextResponse.json({ error: "Invalid user context" }, { status: 403 })
        }
        
        const userNgoId = new ObjectId(ngoId)
        
        if (!eventNgoId || !eventNgoId.equals(userNgoId)) {
            return NextResponse.json({ 
                error: "You can only view participants for your own events" 
            }, { status: 403 })
        }
    }

    const participants = {
      volunteers: [] as any[],
      donors: [] as any[]
    }

    if (type === 'volunteer' || type === 'all' || !type) {
      const volunteerRegistrations = db.collection("volunteer_registrations")
      participants.volunteers = await volunteerRegistrations
        .find({ eventId: new ObjectId(eventId) })
        .sort({ registeredAt: -1 })
        .toArray()
    }

    if (type === 'donor' || type === 'all' || !type) {
      const eventRegistrations = db.collection("event_registrations")
      // Fetch donors and join with user details if possible, or just return registration data
      // event_registrations usually contains userId. We might need to fetch user names if not stored in registration.
      
      const donors = await eventRegistrations
        .aggregate([
          {
            $match: {
              eventId: new ObjectId(eventId),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true
            },
          },
          {
            $project: {
              _id: 1,
              eventId: 1,
              userId: 1,
              alphanumericToken: 1,
              qrToken: 1,
              status: 1,
              createdAt: 1,
              amount: 1, // If applicable
              paymentStatus: 1, // If applicable
              "userName": { $ifNull: ["$name", "$user.name"] },
              "userEmail": { $ifNull: ["$email", "$user.email"] },
              "userPhone": { $ifNull: ["$phone", "$user.phone"] },
              certificateIssued: 1,
              certificateId: 1
            }
          },
          {
            $sort: { createdAt: -1 }
          }
        ])
        .toArray()
        
      participants.donors = donors
    }

    return NextResponse.json({
      success: true,
      data: participants
    })

  } catch (error) {
    console.error("Get event participants error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
