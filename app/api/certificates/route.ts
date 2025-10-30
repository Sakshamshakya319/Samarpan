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
    const certificatesCollection = db.collection("certificates")

    const certificates = await certificatesCollection
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ issuedDate: -1 })
      .toArray()

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error("Get certificates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
