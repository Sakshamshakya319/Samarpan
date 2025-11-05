import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAdminToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || !["admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const db = await getDatabase()
    const adminsCollection = db.collection("admins")

    // Verify admin exists
    const admin = await adminsCollection.findOne({
      _id: new ObjectId(decoded.adminId),
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const { bloodType, requestId } = Object.fromEntries(request.nextUrl.searchParams.entries())
    const acceptedRequestsCollection = db.collection("acceptedRequests")

    let query: any = {}

    if (bloodType) {
      query.bloodType = bloodType
    }

    if (requestId) {
      query.requestId = new ObjectId(requestId)
    }

    const acceptedRequests = await acceptedRequestsCollection.find(query).sort({ acceptedAt: -1 }).toArray()

    return NextResponse.json({ acceptedRequests })
  } catch (error) {
    console.error("Get accepted requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}