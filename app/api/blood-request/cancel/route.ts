import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

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

    const { bloodRequestId } = await request.json()

    if (!bloodRequestId) {
      return NextResponse.json({ error: "Blood request ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const acceptedBloodRequestsCollection = db.collection("acceptedBloodRequests")

    // Find and remove the acceptance record
    const result = await acceptedBloodRequestsCollection.deleteOne({
      bloodRequestId: new ObjectId(bloodRequestId),
      userId: new ObjectId(decoded.userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No acceptance record found for this request" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        message: "Blood donation cancelled successfully",
        requestId: bloodRequestId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Cancel blood request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}