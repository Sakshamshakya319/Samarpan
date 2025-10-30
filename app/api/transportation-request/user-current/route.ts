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
    const transportationCollection = db.collection("transportationRequests")

    // Fetch the most recent pending or assigned transportation request for this user
    const transportation = await transportationCollection
      .findOne(
        {
          userId: new ObjectId(decoded.userId),
          status: { $in: ["pending", "assigned"] },
        },
        {
          sort: { createdAt: -1 },
        }
      )

    if (!transportation) {
      return NextResponse.json({ transportation: null }, { status: 200 })
    }

    return NextResponse.json({ transportation }, { status: 200 })
  } catch (error) {
    console.error("Get user current transportation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}