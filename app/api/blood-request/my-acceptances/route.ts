import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

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

    const db = await getDatabase()
    const acceptedBloodRequestsCollection = db.collection("acceptedBloodRequests")

    // Fetch all acceptances for the current user
    const acceptances = await acceptedBloodRequestsCollection
      .find({
        userId: new ObjectId(decoded.userId),
      })
      .toArray()

    // Map to include bloodRequestId and acceptedAt
    const formattedAcceptances = acceptances.map((acceptance) => ({
      bloodRequestId: acceptance.bloodRequestId.toString(),
      acceptedAt: acceptance.acceptedAt,
    }))

    return NextResponse.json(
      {
        message: "User acceptances fetched successfully",
        acceptances: formattedAcceptances,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Fetch user acceptances error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}