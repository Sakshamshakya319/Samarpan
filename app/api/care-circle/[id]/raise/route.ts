import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { getTokenFromRequest } from "@/lib/auth/auth-utils"
import { verifyToken } from "@/lib/auth/auth"
import { ObjectId } from "mongodb"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id } = params
    const db = await getDatabase()
    const careCircleCollection = db.collection("careCircle")

    const profile = await careCircleCollection.findOne({ _id: new ObjectId(id), createdBy: new ObjectId(decoded.userId) })
    
    if (!profile) {
      return NextResponse.json({ error: "Care Circle profile not found" }, { status: 404 })
    }

    // Call the SOS API to create the request
    // Since we are server-side, we can just insert it or call the POST method logic directly.
    // To keep it simple and ensure all notification logic runs, we'll fetch the local SOS API
    
    // We construct the body for the SOS API based on Care Circle
    const sosBody = {
      requesterName: profile.patientName,
      requesterPhone: profile.patientPhone,
      bloodGroup: profile.bloodGroup,
      bloodComponent: profile.bloodComponent,
      quantity: 1, // Default or pull from profile if it has typical_units
      hospital: profile.hospital,
      urgency: "critical",
      inputMethod: "care-circle",
      care_circle_id: profile._id.toString(),
      care_circle_previous_donors: profile.previousDonorIds || []
    }

    // Determine the base URL for fetching the absolute API route
    // Note: In Next.js app router, making a fetch to an absolute localhost URL during server actions can be tricky.
    // Assuming standard localhost:3000 for dev. In prod it would be the real domain.
    const baseUrl = request.nextUrl.origin;
    
    const sosResponse = await fetch(`${baseUrl}/api/sos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '127.0.0.1'
      },
      body: JSON.stringify(sosBody)
    })

    if (!sosResponse.ok) {
      const errorData = await sosResponse.json();
      return NextResponse.json({ error: errorData.error || "Failed to raise SOS" }, { status: sosResponse.status })
    }

    const sosData = await sosResponse.json();

    // Update last request date
    await careCircleCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { lastRequestDate: new Date(), updatedAt: new Date() }, $inc: { totalRequests: 1 } }
    )

    return NextResponse.json({
      message: "Care Circle SOS raised successfully",
      requestId: sosData.requestId
    }, { status: 201 })
    
  } catch (error) {
    console.error("[Care Circle Raise POST] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
