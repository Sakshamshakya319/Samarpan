import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const db = await getDatabase()
    const adminsCollection = db.collection("admins")
    const admin = await adminsCollection.findOne({
      _id: new ObjectId(decoded.adminId),
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const { userId, donationCount, imageData, signatureData } = await request.json()

    if (!userId || !donationCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const certificatesCollection = db.collection("certificates")
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const certificateData: any = {
      userId: new ObjectId(userId),
      certificateId,
      donationCount,
      issuedDate: new Date(),
      createdBy: new ObjectId(decoded.adminId),
    }

    // Add image data if provided
    if (imageData) {
      certificateData.imageData = imageData
    }

    // Add signature data if provided
    if (signatureData) {
      certificateData.signatureData = signatureData
    }

    const result = await certificatesCollection.insertOne(certificateData)

    // Send notification to user
    const notificationsCollection = db.collection("notifications")
    await notificationsCollection.insertOne({
      userId: new ObjectId(userId),
      title: "Certificate Generated",
      message: `Your donation certificate #${certificateId} has been generated for ${donationCount} donations.`,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Certificate generated successfully",
        certificateId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Generate certificate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
