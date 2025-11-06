import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { certificateId, verificationToken } = await request.json()

    if (!certificateId || !verificationToken) {
      return NextResponse.json(
        { error: "Certificate ID and verification token are required" },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const certificatesCollection = db.collection("certificates")
    const usersCollection = db.collection("users")

    const certificate = await certificatesCollection.findOne({
      certificateId: certificateId.trim(),
      verificationToken: verificationToken.trim(),
      status: "active",
    })

    if (!certificate) {
      console.warn(
        `Certificate verification failed - ID: ${certificateId}, Token: ${verificationToken.substring(0, 8)}...`,
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

    return NextResponse.json(
      {
        verified: true,
        certificate: {
          certificateId: certificate.certificateId,
          donationCount: certificate.donationCount,
          issuedDate: certificate.issuedDate,
          status: certificate.status,
          recipientName: user?.name || "N/A",
          recipientEmail: user?.email || "N/A",
        },
      },
      { status: 200 },
    )
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

    if (!certificateId || !verificationToken) {
      return NextResponse.json(
        { error: "Certificate ID and verification token are required" },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const certificatesCollection = db.collection("certificates")
    const usersCollection = db.collection("users")

    const certificate = await certificatesCollection.findOne({
      certificateId: certificateId.trim(),
      verificationToken: verificationToken.trim(),
      status: "active",
    })

    if (!certificate) {
      console.warn(
        `Certificate verification failed - ID: ${certificateId}, Token: ${verificationToken.substring(0, 8)}...`,
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

    return NextResponse.json(
      {
        verified: true,
        certificate: {
          certificateId: certificate.certificateId,
          donationCount: certificate.donationCount,
          issuedDate: certificate.issuedDate,
          status: certificate.status,
          recipientName: user?.name || "N/A",
          recipientEmail: user?.email || "N/A",
        },
      },
      { status: 200 },
    )
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
