import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Basic admin check - you may need to update this to match your actual auth logic
    // For now, assuming standard middleware or header token check, or you can add JWT verify here
    const authHeader = request.headers.get("authorization")
    // Simple placeholder for Admin check
    if (!authHeader || !authHeader.includes("Admin")) {
      return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { level } = body

    if (![1, 2, 3].includes(level)) {
      return NextResponse.json({ error: "Invalid verification level" }, { status: 400 })
    }

    const db = await getDatabase()
    const bloodRequestsCollection = db.collection("bloodRequests")

    // Update the request
    const result = await bloodRequestsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          verificationLevel: level,
          verifiedAt: new Date(),
          verifiedBy: "Admin" // Replace with actual user ID from token
        } 
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Verify Request Error]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
