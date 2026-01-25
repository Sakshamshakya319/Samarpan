import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { certificateId, verificationToken, certificateToken } = await request.json()

    if (!certificateId || (!verificationToken && !certificateToken)) {
      return NextResponse.json(
        { error: "Certificate ID and verification token (or certificate token) are required" },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const certificatesCollection = db.collection("certificates")
    const volunteerCertificatesCollection = db.collection("volunteer_certificates")
    const usersCollection = db.collection("users")

    let certificate: any = null
    let certificateType = "donation"

    // First, try to find in donation certificates
    if (verificationToken) {
      certificate = await certificatesCollection.findOne({
        certificateId: certificateId.trim(),
        verificationToken: verificationToken.trim(),
        status: "active",
      })
    }

    // If not found, try volunteer certificates with certificate token
    if (!certificate && (certificateToken || verificationToken)) {
      const tokenToUse = (certificateToken || verificationToken)?.trim()
      
      // Try finding with either token field match
      certificate = await volunteerCertificatesCollection.findOne({
        certificateId: certificateId.trim(),
        $or: [
           { certificateToken: tokenToUse },
           { verificationToken: tokenToUse } // Some might be stored as verificationToken
        ],
        status: "active",
      })
      
      if (certificate) {
         certificateType = "volunteer"
      }
    }

    if (!certificate) {
      console.warn(
        `Certificate verification failed - ID: ${certificateId}, Token: ${(verificationToken || certificateToken)?.substring(0, 8)}...`,
      )
      return NextResponse.json(
        { error: "Certificate not found or invalid verification token. Please check your certificate details." },
        { status: 404 },
      )
    }

    let user: any = null
    if (certificate.userId) {
      try {
        user = await usersCollection.findOne({
          _id: new ObjectId(certificate.userId),
        })
      } catch (err) {
        console.error(`Failed to find user for certificate:`, err)
      }
    }

    // Build response based on certificate type
    const response: any = {
      verified: true,
      certificateType,
      certificate: {
        certificateId: certificate.certificateId,
        issuedDate: certificate.issuedDate,
        status: certificate.status,
        recipientName: certificate.userName || user?.name || "N/A",
        recipientEmail: certificate.userEmail || user?.email || "N/A",
      },
    }

    if (certificateType === "donation") {
      response.certificate.donationCount = certificate.donationCount
    } else if (certificateType === "volunteer") {
      response.certificate.eventTitle = certificate.eventTitle
      response.certificate.eventDate = certificate.eventDate
      response.certificate.eventLocation = certificate.eventLocation
      response.certificate.ngoName = certificate.ngoName
      response.certificate.certificateToken = certificate.certificateToken
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Certificate verification error:", error)
    return NextResponse.json(
      {
        error: "An error occurred while verifying the certificate. Please try again later.",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const certificateId = searchParams.get("id")
    const verificationToken = searchParams.get("token")
    const certificateToken = searchParams.get("certificateToken")

    if (!certificateId || (!verificationToken && !certificateToken)) {
      return NextResponse.json(
        { error: "Certificate ID and verification token (or certificate token) are required" },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const certificatesCollection = db.collection("certificates")
    const volunteerCertificatesCollection = db.collection("volunteer_certificates")
    const usersCollection = db.collection("users")

    let certificate: any = null
    let certificateType = "donation"

    // First, try to find in donation certificates
    if (verificationToken) {
      certificate = await certificatesCollection.findOne({
        certificateId: certificateId.trim(),
        verificationToken: verificationToken.trim(),
        status: "active",
      })
    }

    // If not found, try volunteer certificates with certificate token
    if (!certificate && (certificateToken || verificationToken)) {
      const tokenToUse = (certificateToken || verificationToken)?.trim()
      
      // Try finding with either token field match
      certificate = await volunteerCertificatesCollection.findOne({
        certificateId: certificateId.trim(),
        $or: [
           { certificateToken: tokenToUse },
           { verificationToken: tokenToUse }
        ],
        status: "active",
      })
      
      if (certificate) {
         certificateType = "volunteer"
      }
    }

    if (!certificate) {
      console.warn(
        `Certificate verification failed - ID: ${certificateId}, Token: ${(verificationToken || certificateToken)?.substring(0, 8)}...`,
      )
      return NextResponse.json(
        { error: "Certificate not found or invalid verification token. Please check your certificate details." },
        { status: 404 },
      )
    }

    let user: any = null
    if (certificate.userId) {
      try {
        user = await usersCollection.findOne({
          _id: new ObjectId(certificate.userId),
        })
      } catch (err) {
        console.error(`Failed to find user for certificate:`, err)
      }
    }

    // Build response based on certificate type
    const response: any = {
      verified: true,
      certificateType,
      certificate: {
        certificateId: certificate.certificateId,
        issuedDate: certificate.issuedDate,
        status: certificate.status,
        recipientName: certificate.userName || user?.name || "N/A",
        recipientEmail: certificate.userEmail || user?.email || "N/A",
      },
    }

    if (certificateType === "donation") {
      response.certificate.donationCount = certificate.donationCount
    } else if (certificateType === "volunteer") {
      response.certificate.eventTitle = certificate.eventTitle
      response.certificate.eventDate = certificate.eventDate
      response.certificate.eventLocation = certificate.eventLocation
      response.certificate.ngoName = certificate.ngoName
      response.certificate.certificateToken = certificate.certificateToken
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Certificate verification error:", error)
    return NextResponse.json(
      {
        error: "An error occurred while verifying the certificate. Please try again later.",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    )
  }
}
