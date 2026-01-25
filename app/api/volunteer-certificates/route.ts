import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, verifyAdminToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { generateVolunteerCertificate } from "@/lib/volunteer-certificate-generator"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify if it's an admin or NGO token
    let decoded = verifyAdminToken(token)
    let isAdmin = !!decoded
    
    if (!decoded) {
      decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
    }

    const { 
      volunteerRegistrationId, 
      eventId, 
      volunteerIds, // For bulk certificate generation
      ngoSignature,
      ngoLogo,
      authorizedPerson
    } = await request.json()

    const { db } = await connectToDatabase()
    const volunteerRegistrationsCollection = db.collection("volunteer_registrations")
    const eventsCollection = db.collection("events")
    const certificatesCollection = db.collection("volunteer_certificates")
    const ngosCollection = db.collection("ngos")

    let volunteers = []
    let event = null

    if (volunteerRegistrationId) {
      // Single certificate generation
      const volunteer = await volunteerRegistrationsCollection.findOne({
        _id: new ObjectId(volunteerRegistrationId)
      })
      
      if (!volunteer) {
        return NextResponse.json({ error: "Volunteer registration not found" }, { status: 404 })
      }
      
      volunteers = [volunteer]
      event = await eventsCollection.findOne({ _id: volunteer.eventId })
    } else if (eventId && volunteerIds) {
      // Bulk certificate generation
      event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })
      
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }

      volunteers = await volunteerRegistrationsCollection.find({
        eventId: new ObjectId(eventId),
        _id: { $in: volunteerIds.map((id: string) => new ObjectId(id)) }
      }).toArray()
    } else {
      return NextResponse.json({ 
        error: "Either volunteerRegistrationId or eventId with volunteerIds is required" 
      }, { status: 400 })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get NGO details
    let ngoDetails = null
    if (event.ngoId) {
      ngoDetails = await ngosCollection.findOne({ _id: event.ngoId })
    }

    const results = []

    for (const volunteer of volunteers) {
      try {
        console.log(`Processing certificate for volunteer: ${volunteer._id}`)

        // Check if certificate already exists
        const existingCertificate = await certificatesCollection.findOne({
          volunteerRegistrationId: volunteer._id,
          type: "volunteer"
        })

        if (existingCertificate) {
          console.log(`Certificate already exists for volunteer ${volunteer._id}: ${existingCertificate.certificateId}`)
          results.push({
            volunteerId: volunteer._id,
            status: "already_exists",
            certificateId: existingCertificate.certificateId
          })
          continue
        }

        console.log(`Generating new certificate for volunteer ${volunteer._id}`)

        // Generate PDF certificate
        const certificateResult = await generateVolunteerCertificate(
          volunteer,
          event,
          {
            name: ngoDetails?.name || event.ngoName || "Organization",
            authorizedPerson: authorizedPerson || ngoDetails?.contactPerson?.name || "Authorized Person"
          },
          {
            logoData: ngoLogo || ngoDetails?.logo || null,
            signatureData: ngoSignature || ngoDetails?.signature || null
          }
        )

        const { pdfBytes, certificateId, certificateToken } = certificateResult
        console.log(`Generated certificate ID: ${certificateId}, Token: ${certificateToken}`)

        // Save certificate to database
        const certificateDoc = {
          certificateId,
          certificateToken,
          type: "volunteer",
          volunteerRegistrationId: volunteer._id,
          eventId: volunteer.eventId,
          userId: volunteer.userId,
          userName: volunteer.userName,
          userEmail: volunteer.userEmail,
          eventTitle: event.title,
          eventDate: event.eventDate,
          eventLocation: event.location,
          ngoName: ngoDetails?.name || event.ngoName || "Organization",
          issuedDate: new Date(),
          issuedBy: decoded.email || decoded.adminId,
          pdfData: Buffer.from(pdfBytes).toString('base64'),
          verificationUrl: `/verify-certificate?token=${certificateToken}`,
          status: "active"
        }

        const insertResult = await certificatesCollection.insertOne(certificateDoc)
        console.log(`Certificate inserted into DB. Result: ${JSON.stringify(insertResult)}`)

        if (!insertResult.acknowledged) {
            throw new Error("Failed to insert certificate into database")
        }

        // Update volunteer registration to mark certificate as issued
        await volunteerRegistrationsCollection.updateOne(
          { _id: volunteer._id },
          { 
            $set: { 
              certificateIssued: true,
              certificateId: certificateId,
              certificateToken: certificateToken,
              certificateIssuedAt: new Date()
            }
          }
        )

        // Add Dashboard Notification
        try {
            if (volunteer.userId) {
                const notificationsCollection = db.collection("notifications")
                await notificationsCollection.insertOne({
                    userId: new ObjectId(volunteer.userId),
                    title: "Volunteer Certificate Issued",
                    message: `You have received a volunteer certificate for ${event.title}. Check your dashboard to view and download it.`,
                    read: false,
                    createdAt: new Date(),
                    type: "certificate",
                    link: "/dashboard"
                })
            }
        } catch (notifError) {
            console.error("Failed to create dashboard notification:", notifError)
        }

        // Send certificate via email
        try {
          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f0f9ff; padding: 30px; border-radius: 10px; border-left: 4px solid #3b82f6;">
                <h1 style="color: #1e40af; margin: 0 0 20px 0;">Your Volunteer Certificate is Ready! 🏆</h1>
                
                <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                  Dear ${volunteer.userName},
                </p>
                
                <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                  Thank you for your valuable contribution as a volunteer for <strong>${event.title}</strong>. 
                  Your dedication and commitment have made a positive impact in our community.
                </p>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #1e40af; margin: 0 0 15px 0;">Certificate Details:</h3>
                  <p style="margin: 5px 0; color: #6b7280;"><strong>Certificate ID:</strong> ${certificateId}</p>
                  <p style="margin: 5px 0; color: #6b7280;"><strong>Certificate Token:</strong> ${certificateToken}</p>
                  <p style="margin: 5px 0; color: #6b7280;"><strong>Event:</strong> ${event.title}</p>
                  <p style="margin: 5px 0; color: #6b7280;"><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString()}</p>
                  <p style="margin: 5px 0; color: #6b7280;"><strong>Location:</strong> ${event.location}</p>
                  <p style="margin: 5px 0; color: #6b7280;"><strong>Issued by:</strong> ${ngoDetails?.name || event.ngoName || "Organization"}</p>
                </div>
                
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px;">
                    <strong>Certificate Verification:</strong><br>
                    You can verify this certificate online using the Certificate Token: <strong>${certificateToken}</strong><br>
                    Visit: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-certificate?token=${certificateToken}" style="color: #1e40af;">Verify Certificate</a>
                  </p>
                </div>
                
                <p style="color: #374151; line-height: 1.6;">
                  This certificate recognizes your volunteer service and can be used for:
                </p>
                <ul style="color: #374151; line-height: 1.6;">
                  <li>Academic or professional portfolios</li>
                  <li>Community service documentation</li>
                  <li>Personal achievement records</li>
                </ul>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #9ca3af; font-size: 14px;">
                    Thank you for making a difference with Samarpan!
                  </p>
                </div>
              </div>
            </div>
          `

          await sendEmail({
            to: volunteer.userEmail,
            subject: `Your Volunteer Certificate - ${event.title}`,
            html: emailContent,
            attachments: [{
              filename: `Volunteer_Certificate_${certificateId}.pdf`,
              content: Buffer.from(pdfBytes),
              contentType: 'application/pdf'
            }]
          })

          results.push({
            volunteerId: volunteer._id,
            status: "success",
            certificateId: certificateId,
            emailSent: true
          })
        } catch (emailError) {
          console.error("Failed to send certificate email:", emailError)
          results.push({
            volunteerId: volunteer._id,
            status: "success",
            certificateId: certificateId,
            emailSent: false,
            emailError: emailError.message
          })
        }
      } catch (error) {
        console.error(`Error generating certificate for volunteer ${volunteer._id}:`, error)
        results.push({
          volunteerId: volunteer._id,
          status: "error",
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} certificate(s)`,
      results
    })

  } catch (error) {
    console.error("Volunteer certificate generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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
    const certificatesCollection = db.collection("volunteer_certificates")
    
    const url = new URL(request.url)
    const eventId = url.searchParams.get("eventId")
    const certificateId = url.searchParams.get("certificateId")

    let query: any = {}
    
    if (certificateId) {
      query.certificateId = certificateId
    } else if (eventId) {
      query.eventId = new ObjectId(eventId)
    } else {
      query.userId = new ObjectId(decoded.userId)
    }

    const certificates = await certificatesCollection
      .find(query)
      .sort({ issuedDate: -1 })
      .toArray()

    return NextResponse.json({
      certificates,
      total: certificates.length
    })

  } catch (error) {
    console.error("Get volunteer certificates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}