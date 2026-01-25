import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid admin token" }, { status: 403 })
    }

    // Allow both superadmin and regular admins to view NGO events
    // Only superadmin can approve/reject, but others can view
    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")
    const registrationsCollection = db.collection("event_registrations")

    const url = new URL(request.url)
    const status = url.searchParams.get("status")

    // Get NGO events by status (or all if no status specified)
    let query: any = { 
      ngoId: { $exists: true }
    }
    
    // Only add status filter if status is provided
    if (status) {
      query.status = status
    }

    const events = await eventsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // Add registration counts
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const donorCount = await registrationsCollection.countDocuments({
          eventId: event._id
        })
        
        const volunteerCount = await db.collection("volunteer_registrations").countDocuments({
          eventId: event._id
        })

        return {
          ...event,
          registeredVolunteers: volunteerCount, // Corrected to use volunteer count
          registeredDonors: donorCount,
          canModify: decoded.role === "superadmin", // Only superadmin can modify
          // Ensure eventTypes is always an array for consistency
          eventTypes: Array.isArray(event.eventTypes) ? event.eventTypes : [event.eventType || "donation_camp"]
        }
      })
    )

    return NextResponse.json({
      events: eventsWithCounts,
      total: eventsWithCounts.length,
      userRole: decoded.role
    })

  } catch (error) {
    console.error("Admin get NGO events error:", error)
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
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Only super admins can approve/reject NGO events" }, { status: 403 })
    }

    const { eventId, action, rejectionReason } = await request.json()

    if (!eventId || !action || (action === 'reject' && !rejectionReason)) {
      return NextResponse.json({
        error: "Event ID, action, and rejection reason (if rejecting) are required"
      }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Action must be 'approve' or 'reject'" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")

    // Find the event
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.status !== 'pending_approval') {
      return NextResponse.json({ error: "Event is not pending approval" }, { status: 400 })
    }

    const now = new Date()
    let updateData: any = {
      updatedAt: now,
      approvedBy: decoded.adminId,
      approvedAt: now
    }

    let emailSubject = ""
    let emailContent = ""

    if (action === 'approve') {
      updateData.status = 'active'
      updateData.allowRegistrations = true

      emailSubject = "🎉 Event Approved - Ready for Registrations!"
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdf4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 28px;">🎉 Event Approved!</h1>
              <div style="width: 60px; height: 4px; background-color: #059669; margin: 10px auto;"></div>
            </div>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h2 style="color: #059669; margin: 0 0 10px 0; font-size: 18px;">Great News!</h2>
              <p style="color: #166534; margin: 0; line-height: 1.6;">
                Your event "<strong>${event.title}</strong>" has been approved and is now live for user registrations!
              </p>
            </div>

            <div style="margin: 25px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0;">Event Details:</h3>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
                <p style="margin: 5px 0; color: #6b7280;"><strong>Title:</strong> ${event.title}</p>
                <p style="margin: 5px 0; color: #6b7280;"><strong>Date:</strong> ${event.eventDate.toLocaleDateString()}</p>
                <p style="margin: 5px 0; color: #6b7280;"><strong>Location:</strong> ${event.location}</p>
                <p style="margin: 5px 0; color: #6b7280;"><strong>Expected Attendees:</strong> ${event.expectedAttendees}</p>
              </div>
            </div>

            <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #166534; margin: 0 0 10px 0;">What happens next:</h3>
              <ul style="color: #166534; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Your event is now visible to users on the platform</li>
                <li>Users can register as volunteers for your event</li>
                <li>You'll receive notifications about registrations</li>
                <li>You can manage registrations through your NGO dashboard</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/ngo/dashboard" style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Manage Your Event</a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Thank you for organizing blood donation events with Samarpan!<br>
                Together, we save lives through community engagement.
              </p>
            </div>
          </div>
        </div>
      `
    } else { // reject
      updateData.status = 'rejected'
      updateData.rejectionReason = rejectionReason

      emailSubject = "Event Submission Update - Action Required"
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px;">Event Submission Update</h1>
              <div style="width: 60px; height: 4px; background-color: #dc2626; margin: 10px auto;"></div>
            </div>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h2 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">Event Requires Revision</h2>
              <p style="color: #7f1d1d; margin: 0; line-height: 1.6;">
                Your event "<strong>${event.title}</strong>" needs some adjustments before it can be approved.
              </p>
            </div>

            <div style="margin: 25px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0;">Feedback from Admin:</h3>
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; border: 1px solid #fecaca;">
                <p style="margin: 0; color: #7f1d1d; line-height: 1.6;">${rejectionReason}</p>
              </div>
            </div>

            <div style="background-color: #fffbeb; border: 1px solid #fbbf24; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #92400e; margin: 0 0 10px 0;">Next Steps:</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Review the feedback provided above</li>
                <li>Make necessary adjustments to your event</li>
                <li>Submit a new event with the corrections</li>
                <li>Contact support if you need clarification</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/ngo/dashboard" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Create New Event</a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                We appreciate your commitment to organizing blood donation events.<br>
                If you have questions, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      `
    }

    // Update the event
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
    }

    // Send email notification to NGO
    try {
      await sendEmail({
        to: event.ngoEmail,
        subject: emailSubject,
        html: emailContent
      })
    } catch (emailError) {
      console.error(`Failed to send ${action} email:`, emailError)
    }

    return NextResponse.json({
      success: true,
      message: `Event ${action}d successfully`,
      event: {
        _id: event._id,
        title: event.title,
        status: action === 'approve' ? 'active' : 'rejected',
        [action === 'approve' ? 'approvedAt' : 'rejectedAt']: now
      }
    })

  } catch (error) {
    console.error("Admin approve/reject NGO event error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH endpoint for controlling event registrations
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid admin token" }, { status: 403 })
    }

    const { eventId, action } = await request.json()

    if (!eventId || !action) {
      return NextResponse.json({
        error: "Event ID and action are required"
      }, { status: 400 })
    }

    if (!['enable_registration', 'disable_registration'].includes(action)) {
      return NextResponse.json({ 
        error: "Action must be 'enable_registration' or 'disable_registration'" 
      }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")

    // Find the event
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Only allow registration control for active events
    if (event.status !== 'active') {
      return NextResponse.json({ 
        error: "Can only control registrations for active events" 
      }, { status: 400 })
    }

    const allowRegistrations = action === 'enable_registration'

    // Update event registration status
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { 
        $set: { 
          allowRegistrations,
          registrationUpdatedAt: new Date(),
          registrationUpdatedBy: decoded.email
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Log the action
    const actionsCollection = db.collection("admin_actions")
    await actionsCollection.insertOne({
      adminEmail: decoded.email,
      adminRole: decoded.role,
      action: action,
      targetType: "ngo_event",
      targetId: eventId,
      eventTitle: event.title,
      ngoName: event.ngoName,
      timestamp: new Date(),
      details: {
        allowRegistrations,
        previousStatus: event.allowRegistrations
      }
    })

    return NextResponse.json({
      success: true,
      message: `Event registrations ${allowRegistrations ? 'enabled' : 'disabled'} successfully`,
      allowRegistrations
    })

  } catch (error) {
    console.error("Admin control registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}