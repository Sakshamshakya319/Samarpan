import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email"

// Generate a unique 6-digit alphanumeric token
function generateAlphanumericToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const volunteerRegistrationsCollection = db.collection("volunteer_registrations")
    
    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")
    const checkUser = url.searchParams.get("checkUser")

    if (checkUser && eventId) {
      // Check if current user is registered as volunteer for this event
      const registration = await volunteerRegistrationsCollection.findOne({
        eventId: new ObjectId(eventId),
        userId: new ObjectId(decoded.userId)
      })

      // Backfill alphanumericToken if missing
      if (registration && (!registration.alphanumericToken || registration.alphanumericToken.trim() === "")) {
        const newToken = generateAlphanumericToken()
        await volunteerRegistrationsCollection.updateOne(
          { _id: registration._id },
          {
            $set: {
              alphanumericToken: newToken,
              tokenVerified: false,
              updatedAt: new Date(),
            }
          }
        )
        registration.alphanumericToken = newToken
        registration.tokenVerified = false
      }
      
      return NextResponse.json({
        isRegistered: !!registration,
        registration: registration,
        type: 'volunteer'
      })
    }

    // Get all volunteer registrations for user or event
    let query: any = {}
    
    if (eventId) {
      query.eventId = new ObjectId(eventId)
    } else {
      query.userId = new ObjectId(decoded.userId)
    }

    const registrations = await volunteerRegistrationsCollection
      .find(query)
      .sort({ registeredAt: -1 })
      .toArray()

    // Backfill alphanumericToken if missing
    const registrationsNeedingToken = registrations.filter(
      (reg) => !reg.alphanumericToken || reg.alphanumericToken.trim() === ""
    )

    if (registrationsNeedingToken.length > 0) {
      for (const reg of registrationsNeedingToken) {
        const newToken = generateAlphanumericToken()
        await volunteerRegistrationsCollection.updateOne(
          { _id: reg._id },
          {
            $set: {
              alphanumericToken: newToken,
              tokenVerified: false,
              updatedAt: new Date(),
            }
          }
        )
        reg.alphanumericToken = newToken
        reg.tokenVerified = false
      }
    }

    // Enrich registrations with event details
     const eventsCollection = db.collection("events")
     const enrichedRegistrations = await Promise.all(
       registrations.map(async (reg) => {
         // Ensure eventId is treated as ObjectId
         let eventId = reg.eventId
         if (typeof eventId === 'string') {
             try {
                 eventId = new ObjectId(eventId)
             } catch (e) {
                 console.error("Invalid eventId format:", eventId)
             }
         }

         const event = await eventsCollection.findOne({ _id: eventId })
         
         // Self-healing: Update missing denormalized event details if event exists
         if (event && (!reg.eventTitle || !reg.eventDate || !reg.eventLocation)) {
           try {
             await volunteerRegistrationsCollection.updateOne(
               { _id: reg._id },
               {
                 $set: {
                   eventTitle: event.title,
                   eventDate: event.eventDate,
                   eventLocation: event.location,
                   ngoName: event.ngoName || "",
                   // Don't update updatedAt to preserve record history unless necessary
                 }
               }
             )
           } catch (updateError) {
             console.error("Failed to backfill event details for volunteer registration:", updateError)
           }
         }
         
         return {
          ...reg,
          name: reg.userName || reg.name, // Normalize name for frontend
          email: reg.userEmail || reg.email, // Normalize email for frontend
          createdAt: reg.registeredAt || reg.createdAt || new Date(), // Normalize createdAt for frontend
          event: event
            ? {
                title: event.title,
                location: event.location,
                eventDate: event.eventDate,
                ngoName: event.ngoName,
              }
            : {
                // Fallback to stored fields if event not found
                title: reg.eventTitle || "Unknown Event",
                location: reg.eventLocation || "",
                eventDate: reg.eventDate || null,
                ngoName: reg.ngoName || "",
              },
        }
      })
    )

    return NextResponse.json({
      registrations: enrichedRegistrations,
      total: enrichedRegistrations.length
    })

  } catch (error) {
    console.error("Get volunteer registrations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { eventId, motivation, experience, availability, skills, name, email } = await request.json()

    if (!eventId || !motivation || !availability || !name || !email) {
      return NextResponse.json({
        error: "Event ID, motivation, availability, name, and email are required"
      }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const volunteerRegistrationsCollection = db.collection("volunteer_registrations")
    const eventsCollection = db.collection("events")
    const usersCollection = db.collection("users")

    // Check if event exists and is active
    const event = await eventsCollection.findOne({ 
      _id: new ObjectId(eventId),
      status: "active"
    })
    
    if (!event) {
      return NextResponse.json({ error: "Event not found or not active" }, { status: 404 })
    }

    // Check if user is already registered as volunteer
    const existingRegistration = await volunteerRegistrationsCollection.findOne({
      eventId: new ObjectId(eventId),
      userId: new ObjectId(decoded.userId)
    })

    if (existingRegistration) {
      return NextResponse.json({ 
        error: "You are already registered as a volunteer for this event" 
      }, { status: 400 })
    }

    // Check if user is already registered as donor
    const eventRegistrationsCollection = db.collection("event_registrations")
    const existingDonorRegistration = await eventRegistrationsCollection.findOne({
      eventId: new ObjectId(eventId),
      userId: new ObjectId(decoded.userId)
    })

    if (existingDonorRegistration) {
      return NextResponse.json({ 
        error: "You are already registered as a donor for this event" 
      }, { status: 400 })
    }

    // Get user details
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create volunteer registration
    const alphanumericToken = generateAlphanumericToken()
    
    const volunteerRegistration = {
      eventId: new ObjectId(eventId),
      userId: new ObjectId(decoded.userId),
      eventTitle: event.title,
      eventDate: event.eventDate,
      eventLocation: event.location,
      ngoName: event.ngoName || "",
      userName: name,
      userEmail: email,
      userPhone: user.phone || "",
      motivation: motivation.trim(),
      experience: experience?.trim() || "",
      availability: availability.trim(),
      skills: skills?.trim() || "",
      status: "registered",
      alphanumericToken, // Add token for QR code
      tokenVerified: false,
      registeredAt: new Date(),
      certificateIssued: false
    }

    const result = await volunteerRegistrationsCollection.insertOne(volunteerRegistration)

    // Send confirmation email to volunteer
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f0f9ff; padding: 30px; border-radius: 10px; border-left: 4px solid #3b82f6;">
            <h1 style="color: #1e40af; margin: 0 0 20px 0;">Volunteer Registration Confirmed! 🎉</h1>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Thank you for registering as a volunteer for <strong>${event.title}</strong>!
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0;">Event Details:</h3>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Event:</strong> ${event.title}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Location:</strong> ${event.location}</p>
              ${event.ngoName ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Organized by:</strong> ${event.ngoName}</p>` : ''}
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>What's Next:</strong><br>
                • You'll receive further instructions closer to the event date<br>
                • A volunteer certificate will be issued after successful participation<br>
                • Contact the organizers if you have any questions
              </p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
              We appreciate your commitment to making a positive impact in the community!
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px;">
                Thank you for volunteering with Samarpan!
              </p>
            </div>
          </div>
        </div>
      `

      await sendEmail({
        to: email,
        subject: `Volunteer Registration Confirmed - ${event.title}`,
        html: emailContent
      })
    } catch (emailError) {
      console.error("Failed to send volunteer confirmation email:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Successfully registered as volunteer",
      registrationId: result.insertedId
    })

  } catch (error) {
    console.error("Volunteer registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}