import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { generateVolunteerCertificate } from "@/lib/volunteer-certificate-generator"

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

    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
        return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const certificatesCollection = db.collection("volunteer_certificates")

    // Find certificate by ID (either _id or certificateId)
    let query: any = {
      $or: [
        { certificateId: id },
      ]
    }
    
    if (ObjectId.isValid(id)) {
      query.$or.push({ _id: new ObjectId(id) })
    }

    const certificate = await certificatesCollection.findOne(query)

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    // Verify ownership
    if (certificate.userId && certificate.userId.toString() !== decoded.userId) {
       // Allow admins to download anyone's certificate
       if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
         return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
       }
    }

    let pdfBuffer: Buffer

    // Always regenerate the PDF to ensure the latest layout and fixes are applied
    // This solves issues with "bad layout" in stored PDFs and "Failed to load PDF" errors due to corrupted data
    const eventsCollection = db.collection("events")
    const event = await eventsCollection.findOne({ _id: new ObjectId(certificate.eventId) })
    
    if (event) {
      const volunteer = {
        userName: certificate.userName,
        certificateId: certificate.certificateId,
        userId: certificate.userId
      }

      const ngo = {
        name: certificate.ngoName,
        authorizedPerson: certificate.issuedBy // Fallback
      }

      const result = await generateVolunteerCertificate(
        volunteer, 
        event, 
        ngo,
        {
           existingCertificateId: certificate.certificateId,
           existingToken: certificate.certificateToken,
           issuedDate: certificate.issuedDate ? new Date(certificate.issuedDate) : undefined,
           // Pass stored logo/signature if available in future, currently we rely on event/ngo or defaults
        }
      )
      pdfBuffer = Buffer.from(result.pdfBytes)
    } else {
      // Fallback to stored PDF if event is missing (though unlikely)
      if (certificate.pdfData) {
         pdfBuffer = Buffer.from(certificate.pdfData, 'base64')
      } else {
         return NextResponse.json({ error: "Event data missing and no stored PDF found" }, { status: 500 })
      }
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Volunteer-Certificate-${certificate.certificateId}.pdf"`,
      },
    })

  } catch (error) {
    console.error("Download volunteer certificate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
